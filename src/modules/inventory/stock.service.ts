import { supabase } from '../../config/supabase.js'

async function applyRecipeInventory(orderId: string, branchId: string, multiplier: 1 | -1) {
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('menu_item_id, combo_id, quantity')
    .eq('order_id', orderId)

  if (!orderItems?.length) return

  const menuItemIds: Array<{ id: string; qty: number }> = []

  for (const item of orderItems) {
    if (item.menu_item_id) {
      menuItemIds.push({ id: item.menu_item_id, qty: item.quantity })
    }

    if (item.combo_id) {
      const { data: comboItems } = await supabase
        .from('combo_items')
        .select('menu_item_id, quantity')
        .eq('combo_id', item.combo_id)

      comboItems?.forEach((comboItem) => {
        menuItemIds.push({ id: comboItem.menu_item_id, qty: comboItem.quantity * item.quantity })
      })
    }
  }

  for (const { id, qty } of menuItemIds) {
    const { data: recipe } = await supabase
      .from('recipes')
      .select(`
        quantity,
        inventory_item:inventory_items!inner(id, is_auto_deduct, stock_min, name)
      `)
      .eq('menu_item_id', id)

    if (!recipe?.length) continue

    for (const ingredient of recipe as Array<Record<string, any>>) {
      if (!ingredient.inventory_item?.is_auto_deduct) continue

      const delta = ingredient.quantity * qty * multiplier
      const { data: stock } = await supabase
        .from('inventory_stock')
        .select('current_qty')
        .eq('item_id', ingredient.inventory_item.id)
        .eq('branch_id', branchId)
        .single()

      const currentQty = stock?.current_qty ?? 0
      const newQty = multiplier === 1 ? Math.max(0, currentQty - delta) : currentQty + Math.abs(delta)

      await supabase
        .from('inventory_stock')
        .upsert(
          {
            item_id: ingredient.inventory_item.id,
            branch_id: branchId,
            current_qty: newQty,
          },
          { onConflict: 'item_id,branch_id' },
        )

      await supabase.from('inventory_movements').insert({
        item_id: ingredient.inventory_item.id,
        branch_id: branchId,
        type: multiplier === 1 ? 'exit' : 'adjustment',
        quantity: Math.abs(delta),
        reason: multiplier === 1 ? `Venta - Order ${orderId}` : `Reversión - Order ${orderId}`,
        user_id: 'system',
      })

      if (multiplier === 1 && newQty <= (ingredient.inventory_item.stock_min ?? 0)) {
        await supabase.from('notifications').insert({
          branch_id: branchId,
          user_id: 'system',
          type: 'stock_low',
          title: 'Stock bajo',
          message: `${ingredient.inventory_item.name}: ${newQty} unidades`,
        })
      }
    }
  }
}

export async function deductInventoryForOrder(orderId: string, branchId: string) {
  await applyRecipeInventory(orderId, branchId, 1)
}

export async function restoreInventoryForOrder(orderId: string, branchId: string) {
  await applyRecipeInventory(orderId, branchId, -1)
}
