import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

export const tablesService = {
  async getAll(branchId: string) {
    const { data, error } = await supabase.from('tables').select('*').eq('branch_id', branchId).order('number')
    handleSupabaseError(error)
    return data ?? []
  },

  async create(branchId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('tables')
      .insert({ branch_id: branchId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Mesa')
  },

  async update(id: string, branchId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('tables')
      .update(body)
      .eq('id', id)
      .eq('branch_id', branchId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Mesa')
  },

  async delete(id: string, branchId: string) {
    const { error } = await supabase.from('tables').delete().eq('id', id).eq('branch_id', branchId)
    handleSupabaseError(error)
    return { success: true }
  },
}
