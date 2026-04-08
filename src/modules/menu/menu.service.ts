import type { PaginationParams } from '../../common/types.js'
import { supabase } from '../../config/supabase.js'
import { buildPaginatedResult, paginatedQuery } from '../../common/pagination.js'
import { ensureFound, handleSupabaseError, toBoolean } from '../../common/db.js'

export const menuService = {
  async getCategories(restaurantId: string) {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order')

    handleSupabaseError(error)
    return data ?? []
  },

  async createCategory(restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({ restaurant_id: restaurantId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Categoría')
  },

  async updateCategory(id: string, restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('menu_categories')
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
      .from('menu_categories')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(error)
    return { success: true }
  },

  async getItems(restaurantId: string, pagination: PaginationParams, filters: Record<string, unknown>) {
    const { from, to } = paginatedQuery(pagination)
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(id, name)
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
    return buildPaginatedResult(data ?? [], count ?? 0, pagination)
  },

  async createItem(restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({ restaurant_id: restaurantId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Producto del menú')
  },

  async getItemById(id: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(id, name)
      `)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Producto del menú')
  },

  async updateItem(id: string, restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('menu_items')
      .update(body)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Producto del menú')
  },

  async deleteItem(id: string, restaurantId: string) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(error)
    return { success: true }
  },

  async findByBarcode(restaurantId: string, barcode: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(id, name)
      `)
      .eq('restaurant_id', restaurantId)
      .eq('barcode', barcode)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Producto del menú')
  },
}
