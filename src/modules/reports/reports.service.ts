import { supabase } from '../../config/supabase.js'
import { handleSupabaseError } from '../../common/db.js'

export const reportsService = {
  async sales(branchId: string, query: Record<string, unknown>) {
    let reportQuery = supabase
      .from('invoices')
      .select('id, total, tax_amount, created_at, invoice_payments(method, amount)')
      .eq('branch_id', branchId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (query.from) reportQuery = reportQuery.gte('created_at', String(query.from))
    if (query.to) reportQuery = reportQuery.lte('created_at', String(query.to))

    const { data, error } = await reportQuery
    handleSupabaseError(error)
    return data ?? []
  },

  async inventory(branchId: string) {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select('*, item:inventory_items(name, sku, stock_min, price_cost)')
      .eq('branch_id', branchId)

    handleSupabaseError(error)
    return data ?? []
  },

  async expenses(branchId: string, query: Record<string, unknown>) {
    let reportQuery = supabase
      .from('expenses')
      .select('*, category:expense_categories(name)')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    if (query.from) reportQuery = reportQuery.gte('created_at', String(query.from))
    if (query.to) reportQuery = reportQuery.lte('created_at', String(query.to))

    const { data, error } = await reportQuery
    handleSupabaseError(error)
    return data ?? []
  },

  async pnl(restaurantId: string) {
    const [{ data: invoices }, { data: expenses }, { data: employees }] = await Promise.all([
      supabase.from('invoices').select('branch_id, total').eq('status', 'active'),
      supabase.from('expenses').select('branch_id, amount'),
      supabase.from('employees').select('branch_id, salary').eq('restaurant_id', restaurantId).eq('is_active', true),
    ])

    return {
      invoices: invoices ?? [],
      expenses: expenses ?? [],
      payroll: employees ?? [],
    }
  },
}
