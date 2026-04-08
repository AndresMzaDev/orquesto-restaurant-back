import type { FastifyRequest } from 'fastify'

export interface AuthUser {
  id: string
  email: string
  is_master: boolean
  employee_id: string | null
  restaurant_id: string | null
  branch_id: string | null
  role_id: string | null
  permissions: string[]
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser: AuthUser
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>
  }
}
