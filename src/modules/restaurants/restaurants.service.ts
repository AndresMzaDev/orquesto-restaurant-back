import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

export const restaurantsService = {
  async getById(id: string) {
    const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).single()
    handleSupabaseError(error)
    return ensureFound(data, 'Restaurante')
  },

  async update(id: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('restaurants')
      .update(body)
      .eq('id', id)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Restaurante')
  },
}
