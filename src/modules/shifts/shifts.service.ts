import { supabase } from '../../config/supabase.js'
import { ConflictError, ForbiddenError } from '../../common/errors.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

export const shiftsService = {
  async ensureOpenShift(branchId: string, employeeId: string) {
    const { data, error } = await supabase
      .from('cash_shifts')
      .select('*')
      .eq('branch_id', branchId)
      .eq('employee_id', employeeId)
      .eq('status', 'open')
      .single()

    if (error || !data) {
      throw new ForbiddenError('No hay turno abierto')
    }

    return data
  },

  async open(branchId: string, employeeId: string, openingAmount: number) {
    const { data: currentShift } = await supabase
      .from('cash_shifts')
      .select('id')
      .eq('branch_id', branchId)
      .eq('employee_id', employeeId)
      .eq('status', 'open')
      .single()

    if (currentShift) {
      throw new ConflictError('Ya existe un turno abierto')
    }

    const { data, error } = await supabase
      .from('cash_shifts')
      .insert({
        branch_id: branchId,
        employee_id: employeeId,
        opening_amount: openingAmount,
        cash_sales: 0,
        card_sales: 0,
        status: 'open',
      })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Turno')
  },

  async close(branchId: string, employeeId: string, closingAmount: number) {
    const shift = await this.ensureOpenShift(branchId, employeeId)
    const expectedAmount = (shift.opening_amount ?? 0) + (shift.cash_sales ?? 0)
    const difference = closingAmount - expectedAmount

    const { data, error } = await supabase
      .from('cash_shifts')
      .update({
        closing_amount: closingAmount,
        expected_amount: expectedAmount,
        difference,
        closed_at: new Date().toISOString(),
        status: 'closed',
      })
      .eq('id', shift.id)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Turno')
  },

  async getCurrent(branchId: string, employeeId: string) {
    return this.ensureOpenShift(branchId, employeeId)
  },

  async getHistory(branchId: string) {
    const { data, error } = await supabase
      .from('cash_shifts')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    handleSupabaseError(error)
    return data ?? []
  },
}
