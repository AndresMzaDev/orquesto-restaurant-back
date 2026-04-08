import type { FastifyRequest } from 'fastify'
import { ForbiddenError } from './errors.js'

export function requirePermission(request: FastifyRequest, permission: string) {
  if (request.authUser.is_master) return
  if (!request.authUser.permissions.includes(permission)) {
    throw new ForbiddenError()
  }
}

export function requireMaster(request: FastifyRequest) {
  if (!request.authUser.is_master) {
    throw new ForbiddenError('Solo el master puede realizar esta acción')
  }
}

export function requireBranch(request: FastifyRequest): string {
  const branchId = request.authUser.branch_id
  if (!branchId) throw new ForbiddenError('No tiene sucursal asignada')
  return branchId
}

export function requireRestaurant(request: FastifyRequest): string {
  const restaurantId = request.authUser.restaurant_id
  if (!restaurantId) throw new ForbiddenError('No tiene restaurante asignado')
  return restaurantId
}
