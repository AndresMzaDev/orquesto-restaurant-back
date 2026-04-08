import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

export const notificationsService = {
  async getAll(branchId: string, userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('branch_id', branchId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })

    handleSupabaseError(error)
    return data ?? []
  },

  async getAllByRestaurant(restaurantId: string, userId: string) {
    // Get all branch IDs for this restaurant first
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(branchError)
    const branchIds = (branches ?? []).map((b: { id: string }) => b.id)
    if (branchIds.length === 0) return []

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .in('branch_id', branchIds)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })

    handleSupabaseError(error)
    return data ?? []
  },

  async markRead(id: string, branchId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('branch_id', branchId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Notificación')
  },

  async markReadByRestaurant(id: string, restaurantId: string) {
    // Get all branch IDs for this restaurant
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(branchError)
    const branchIds = (branches ?? []).map((b: { id: string }) => b.id)

    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .in('branch_id', branchIds.length > 0 ? branchIds : [''])
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Notificación')
  },
}
