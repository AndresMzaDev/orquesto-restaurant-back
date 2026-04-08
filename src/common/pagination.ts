import type { PaginatedResult, PaginationParams } from './types.js'

export function getPaginationParams(query: Record<string, unknown>): PaginationParams {
  return {
    page: Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1),
    limit: Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? '20'), 10) || 20)),
  }
}

export function paginatedQuery(params: PaginationParams) {
  const from = (params.page - 1) * params.limit
  const to = from + params.limit - 1
  return { from, to }
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
  }
}
