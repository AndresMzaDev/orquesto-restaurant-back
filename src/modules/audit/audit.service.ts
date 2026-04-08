import type { PaginationParams } from '../../common/types.js'
import { supabase } from '../../config/supabase.js'
import { buildPaginatedResult, paginatedQuery } from '../../common/pagination.js'
import { handleSupabaseError } from '../../common/db.js'

export const auditService = {
  async getAll(branchId: string | null, pagination: PaginationParams) {
    const { from, to } = paginatedQuery(pagination)
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false })

    if (branchId) query = query.eq('branch_id', branchId)

    const { data, error, count } = await query
    handleSupabaseError(error)
    return buildPaginatedResult(data ?? [], count ?? 0, pagination)
  },
}
