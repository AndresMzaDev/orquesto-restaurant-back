import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

export const branchesService = {
  async getAll(restaurantId: string) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    handleSupabaseError(error)
    return data ?? []
  },

  async create(restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('branches')
      .insert({ restaurant_id: restaurantId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    const branch = ensureFound(data, 'Sucursal')

    const { data: items } = await supabase.from('inventory_items').select('id').eq('restaurant_id', restaurantId)
    if (items?.length) {
      await supabase.from('inventory_stock').insert(
        items.map((item) => ({
          item_id: item.id,
          branch_id: branch.id,
          current_qty: 0,
        })),
      )
    }

    return branch
  },

  async getById(id: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Sucursal')
  },

  async update(id: string, restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('branches')
      .update(body)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Sucursal')
  },
}
