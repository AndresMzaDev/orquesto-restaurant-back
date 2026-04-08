import type { PaginationParams } from '../../common/types.js'
import { supabase } from '../../config/supabase.js'
import { buildPaginatedResult, paginatedQuery } from '../../common/pagination.js'
import { ensureFound, handleSupabaseError, toBoolean } from '../../common/db.js'

export const inventoryService = {
  async getCategories(restaurantId: string) {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order')

    handleSupabaseError(error)
    return data ?? []
  },

  async createCategory(restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('inventory_categories')
      .insert({ restaurant_id: restaurantId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Categoría')
  },

  async updateCategory(id: string, restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('inventory_categories')
      .update(body)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Categoría')
  },

  async deleteCategory(id: string, restaurantId: string) {
    const { error } = await supabase
      .from('inventory_categories')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(error)
    return { success: true }
  },

  async getItems(restaurantId: string, branchId: string, pagination: PaginationParams, filters: Record<string, unknown>) {
    const { from, to } = paginatedQuery(pagination)
    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(id, name),
        stock:inventory_stock!left(branch_id, current_qty)
      `, { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .range(from, to)
      .order('name')

    if (filters.category_id) query = query.eq('category_id', filters.category_id)

    const isActive = toBoolean(filters.is_active)
    if (isActive !== undefined) query = query.eq('is_active', isActive)

    if (filters.search) query = query.ilike('name', `%${String(filters.search)}%`)

    const { data, error, count } = await query
    handleSupabaseError(error)

    const normalizedData = (data ?? []).map((item: any) => ({
      ...item,
      stock: Array.isArray(item.stock) ? item.stock.find((stock: any) => stock.branch_id === branchId) ?? null : item.stock,
    }))

    const finalData = toBoolean(filters.low_stock)
      ? normalizedData.filter((item: any) => (item.stock?.current_qty ?? 0) <= (item.stock_min ?? 0))
      : normalizedData

    return buildPaginatedResult(finalData, count ?? finalData.length, pagination)
  },

  async getItemById(id: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(id, name)
      `)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Producto')
  },

  async findByBarcode(restaurantId: string, barcode: string) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(id, name)
      `)
      .eq('restaurant_id', restaurantId)
      .eq('barcode', barcode)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Producto')
  },

  async createItem(restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({ restaurant_id: restaurantId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    const item = ensureFound(data, 'Producto')

    const { data: branches } = await supabase
      .from('branches')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)

    if (branches?.length) {
      await supabase.from('inventory_stock').insert(
        branches.map((branch) => ({
          item_id: item.id,
          branch_id: branch.id,
          current_qty: 0,
        })),
      )
    }

    return item
  },

  async updateItem(id: string, restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(body)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Producto')
  },

  async deleteItem(id: string, restaurantId: string) {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(error)
    return { success: true }
  },

  async getStock(branchId: string) {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`
        *,
        item:inventory_items(id, name, sku, unit_name, stock_min, is_auto_deduct)
      `)
      .eq('branch_id', branchId)

    handleSupabaseError(error)
    return data ?? []
  },

  async createMovement(branchId: string, userId: string, body: { item_id: string; type: 'entry' | 'exit' | 'adjustment'; quantity: number; reason?: string }) {
    const { data: movement, error } = await supabase
      .from('inventory_movements')
      .insert({
        item_id: body.item_id,
        branch_id: branchId,
        type: body.type,
        quantity: Math.abs(body.quantity),
        reason: body.reason ?? '',
        user_id: userId,
      })
      .select('*')
      .single()

    handleSupabaseError(error)

    const { data: currentStock } = await supabase
      .from('inventory_stock')
      .select('current_qty')
      .eq('item_id', body.item_id)
      .eq('branch_id', branchId)
      .single()

    const currentQty = currentStock?.current_qty ?? 0
    const signedQuantity =
      body.type === 'entry'
        ? Math.abs(body.quantity)
        : body.type === 'exit'
          ? -Math.abs(body.quantity)
          : body.quantity

    const newQty = Math.max(0, currentQty + signedQuantity)

    await supabase
      .from('inventory_stock')
      .upsert(
        {
          item_id: body.item_id,
          branch_id: branchId,
          current_qty: newQty,
        },
        { onConflict: 'item_id,branch_id' },
      )

    return movement
  },
}
