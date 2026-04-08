import { supabase } from '../../config/supabase.js'
import { BadRequestError, ConflictError } from '../../common/errors.js'
import { buildPaginatedResult, paginatedQuery } from '../../common/pagination.js'
import type { PaginationParams } from '../../common/types.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'
import { shiftsService } from '../shifts/shifts.service.js'
import { deductInventoryForOrder } from '../inventory/stock.service.js'

async function getRestaurantTaxRate(restaurantId: string) {
  const { data } = await supabase.from('restaurants').select('tax_rate').eq('id', restaurantId).single()
  return data?.tax_rate ?? 0
}

export const ordersService = {
  async getAll(branchId: string, pagination: PaginationParams, filters: Record<string, unknown>) {
    const { from, to } = paginatedQuery(pagination)
    let query = supabase
      .from('orders')
      .select(`
        *,
        table:tables(*),
        items:order_items(*)
      `, { count: 'exact' })
      .eq('branch_id', branchId)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.table_id) query = query.eq('table_id', filters.table_id)

    const { data, error, count } = await query
    handleSupabaseError(error)
    return buildPaginatedResult(data ?? [], count ?? 0, pagination)
  },

  async create(restaurantId: string, branchId: string, employeeId: string, body: { type: 'dine_in' | 'walk_in'; table_id?: string | null }) {
    if (body.type === 'walk_in') {
      await shiftsService.ensureOpenShift(branchId, employeeId)
    }

    if (body.type === 'dine_in' && body.table_id) {
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .select('*')
        .eq('id', body.table_id)
        .eq('branch_id', branchId)
        .single()

      handleSupabaseError(tableError)
      const foundTable = ensureFound(table, 'Mesa')

      if (!['free', 'occupied'].includes(foundTable.status)) {
        throw new ConflictError('La mesa no está disponible')
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        branch_id: branchId,
        table_id: body.table_id ?? null,
        waiter_id: employeeId,
        type: body.type,
        status: 'open',
      })
      .select('*')
      .single()

    handleSupabaseError(error)
    const order = ensureFound(data, 'Pedido')

    if (body.type === 'dine_in' && body.table_id) {
      await supabase.from('tables').update({ status: 'occupied' }).eq('id', body.table_id)
    }

    return order
  },

  async getById(id: string, branchId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        table:tables(*),
        items:order_items(*)
      `)
      .eq('id', id)
      .eq('branch_id', branchId)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Pedido')
  },

  async addItem(orderId: string, restaurantId: string, body: { menu_item_id?: string | null; combo_id?: string | null; quantity: number; notes?: string }) {
    if (!body.menu_item_id && !body.combo_id) {
      throw new BadRequestError('Debe enviar menu_item_id o combo_id')
    }

    const order = await this.getById(orderId, (await supabase.from('orders').select('branch_id').eq('id', orderId).single()).data?.branch_id ?? '')
    const taxRate = await getRestaurantTaxRate(restaurantId)

    let itemName = ''
    let itemBarcode = ''
    let unitPrice = 0
    let stationId: string | null = null

    if (body.menu_item_id) {
      const { data: menuItem, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', body.menu_item_id)
        .eq('restaurant_id', restaurantId)
        .single()

      handleSupabaseError(error)
      const foundItem = ensureFound(menuItem, 'Producto del menú')
      itemName = foundItem.name
      itemBarcode = foundItem.barcode ?? ''
      unitPrice = foundItem.price

      const { data: station } = await supabase
        .from('menu_item_stations')
        .select('station_id')
        .eq('menu_item_id', body.menu_item_id)
        .limit(1)
        .single()

      stationId = station?.station_id ?? null
    }

    if (body.combo_id) {
      const { data: combo, error } = await supabase
        .from('combos')
        .select('*')
        .eq('id', body.combo_id)
        .eq('restaurant_id', restaurantId)
        .single()

      handleSupabaseError(error)
      const foundCombo = ensureFound(combo, 'Combo')
      itemName = foundCombo.name
      itemBarcode = foundCombo.barcode ?? ''
      unitPrice = foundCombo.price
      stationId = null
    }

    const { data, error } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        menu_item_id: body.menu_item_id ?? null,
        combo_id: body.combo_id ?? null,
        item_name: itemName,
        item_barcode: itemBarcode,
        unit_price: unitPrice,
        tax_rate: taxRate,
        quantity: body.quantity,
        notes: body.notes ?? '',
        station_id: stationId,
        status: 'pending',
      })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Item del pedido')
  },

  async updateItemStatus(orderId: string, itemId: string, status: 'pending' | 'preparing' | 'ready' | 'delivered', branchId: string) {
    const { data, error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', itemId)
      .eq('order_id', orderId)
      .select('*')
      .single()

    handleSupabaseError(error)
    const item = ensureFound(data, 'Item del pedido')

    if (status === 'ready') {
      const order = await this.getById(orderId, branchId)
      await supabase.from('notifications').insert({
        branch_id: branchId,
        user_id: order.waiter_id,
        type: 'order_ready',
        title: 'Pedido listo',
        message: `${item.item_name} ya puede ser entregado`,
      })
    }

    return item
  },

  async finalizeClosure(orderId: string, branchId: string) {
    const order = await this.getById(orderId, branchId)
    const items = order.items ?? []

    if (!items.length) {
      throw new BadRequestError('El pedido no tiene items para cerrar')
    }

    if (order.type === 'walk_in') {
      const itemIdsToDeliver = items
        .filter((item: any) => item.status !== 'delivered')
        .map((item: any) => item.id)

      if (itemIdsToDeliver.length > 0) {
        const { error } = await supabase
          .from('order_items')
          .update({ status: 'delivered' })
          .in('id', itemIdsToDeliver)
          .eq('order_id', orderId)

        handleSupabaseError(error)
      }
    } else {
      const allDelivered = items.every((item: any) => ['ready', 'delivered'].includes(item.status))
      if (!allDelivered) {
        throw new BadRequestError('Todos los items deben estar listos o entregados')
      }
    }

    await deductInventoryForOrder(orderId, branchId)
    await supabase.from('orders').update({ status: 'closed' }).eq('id', orderId).eq('branch_id', branchId)

    if (order.table_id) {
      await supabase.from('tables').update({ status: 'free' }).eq('id', order.table_id)
    }

    return { success: true }
  },

  async close(orderId: string, branchId: string) {
    return this.finalizeClosure(orderId, branchId)
  },

  async cancel(orderId: string, branchId: string) {
    const order = await this.getById(orderId, branchId)

    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId).eq('branch_id', branchId)
    if (order.table_id) {
      await supabase.from('tables').update({ status: 'free' }).eq('id', order.table_id)
    }

    return { success: true }
  },
}
