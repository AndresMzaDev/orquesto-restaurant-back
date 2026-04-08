import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

export const comboService = {
  async getAll(restaurantId: string) {
    const { data, error } = await supabase
      .from('combos')
      .select(`
        *,
        items:combo_items(*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('name')

    handleSupabaseError(error)
    return data ?? []
  },

  async create(restaurantId: string, body: Record<string, any>) {
    const { items = [], ...comboBody } = body
    const { data, error } = await supabase
      .from('combos')
      .insert({ restaurant_id: restaurantId, ...comboBody })
      .select('*')
      .single()

    handleSupabaseError(error)
    const combo = ensureFound(data, 'Combo')

    if (items.length > 0) {
      await supabase.from('combo_items').insert(
        items.map((item: any) => ({
          combo_id: combo.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
        })),
      )
    }

    return combo
  },

  async getById(id: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('combos')
      .select(`
        *,
        items:combo_items(*)
      `)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Combo')
  },

  async update(id: string, restaurantId: string, body: Record<string, any>) {
    const { items = [], ...comboBody } = body
    const { data, error } = await supabase
      .from('combos')
      .update(comboBody)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    const combo = ensureFound(data, 'Combo')

    if (Array.isArray(items)) {
      await supabase.from('combo_items').delete().eq('combo_id', id)
      if (items.length > 0) {
        await supabase.from('combo_items').insert(
          items.map((item: any) => ({
            combo_id: id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
          })),
        )
      }
    }

    return combo
  },

  async delete(id: string, restaurantId: string) {
    const { error } = await supabase
      .from('combos')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(error)
    return { success: true }
  },
}
