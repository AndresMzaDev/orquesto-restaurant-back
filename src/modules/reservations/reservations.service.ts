import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

async function syncTableStatus(tableId: string | undefined, status: string) {
  if (!tableId) return

  if (status === 'confirmed') {
    await supabase.from('tables').update({ status: 'reserved' }).eq('id', tableId)
  }

  if (status === 'cancelled' || status === 'completed') {
    await supabase.from('tables').update({ status: 'free' }).eq('id', tableId)
  }
}

export const reservationsService = {
  async getAll(branchId: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('branch_id', branchId)
      .order('date', { ascending: true })
      .order('time_start', { ascending: true })

    handleSupabaseError(error)
    return data ?? []
  },

  async create(branchId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('reservations')
      .insert({ branch_id: branchId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    const reservation = ensureFound(data, 'Reservación')
    await syncTableStatus(reservation.table_id, reservation.status)
    return reservation
  },

  async update(id: string, branchId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('reservations')
      .update(body)
      .eq('id', id)
      .eq('branch_id', branchId)
      .select('*')
      .single()

    handleSupabaseError(error)
    const reservation = ensureFound(data, 'Reservación')
    await syncTableStatus(reservation.table_id, reservation.status)
    return reservation
  },
}
