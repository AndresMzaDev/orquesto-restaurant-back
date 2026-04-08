import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

export const expensesService = {
  async getCategories(restaurantId: string) {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name')

    handleSupabaseError(error)
    return data ?? []
  },

  async createCategory(restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({ restaurant_id: restaurantId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Categoría de gasto')
  },

  async updateCategory(id: string, restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('expense_categories')
      .update(body)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Categoría de gasto')
  },

  async deleteCategory(id: string, restaurantId: string) {
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(error)
    return { success: true }
  },

  async getAll(branchId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, category:expense_categories(*)')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    handleSupabaseError(error)
    return data ?? []
  },

  async create(branchId: string, userId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        branch_id: branchId,
        created_by: userId,
        ...body,
      })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Gasto')
  },

  async delete(id: string, branchId: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('branch_id', branchId)

    handleSupabaseError(error)
    return { success: true }
  },
}
