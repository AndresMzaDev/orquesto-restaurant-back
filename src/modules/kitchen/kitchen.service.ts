import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

export const kitchenService = {
  async getStations(branchId: string) {
    const { data, error } = await supabase
      .from('kitchen_stations')
      .select('*')
      .eq('branch_id', branchId)
      .order('name')

    handleSupabaseError(error)
    return data ?? []
  },

  async createStation(branchId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('kitchen_stations')
      .insert({ branch_id: branchId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Estación')
  },

  async updateStation(id: string, branchId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('kitchen_stations')
      .update(body)
      .eq('id', id)
      .eq('branch_id', branchId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Estación')
  },

  async deleteStation(id: string, branchId: string) {
    const { error } = await supabase.from('kitchen_stations').delete().eq('id', id).eq('branch_id', branchId)
    handleSupabaseError(error)
    return { success: true }
  },
}
