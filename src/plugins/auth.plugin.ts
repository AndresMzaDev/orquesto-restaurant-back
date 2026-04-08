import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { supabase } from '../config/supabase.js'
import type { AuthUser } from '../common/types.js'
import { UnauthorizedError } from '../common/errors.js'

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedError('Token requerido')
console.log('hola')
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser(token)
      if (authError || !authData.user) throw new UnauthorizedError('Token inválido')

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, is_master')
        .eq('id', authData.user.id)
        .single()

      if (userError || !user) {
        throw new UnauthorizedError('Usuario no encontrado')
      }

      let employee: Record<string, any> | null = null
      let permissions: string[] = []

      if (!user.is_master) {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select(`
            id,
            restaurant_id,
            branch_id,
            role_id,
            roles(
              role_permissions(
                permissions(code)
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (employeeError || !employeeData) {
          throw new UnauthorizedError('Empleado inactivo')
        }

        employee = employeeData as Record<string, any>
        permissions =
          employee.roles?.role_permissions?.map((rolePermission: any) => rolePermission.permissions?.code).filter(Boolean) ??
          []
      }

      request.authUser = {
        id: user.id,
        email: user.email,
        is_master: user.is_master,
        employee_id: employee?.id ?? null,
        restaurant_id: employee?.restaurant_id ?? null,
        branch_id: employee?.branch_id ?? null,
        role_id: employee?.role_id ?? null,
        permissions,
      } as AuthUser
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error
      throw new UnauthorizedError('Token inválido')
    }
  })

  const isPublicPath = (url: string) => {
    const path = url.split('?')[0] ?? url
    return path === '/' || path === '/favicon.ico' || path === '/api/auth/login' || path === '/api/auth/register'
  }

  fastify.addHook('onRequest', async (request) => {
    if (isPublicPath(request.url)) return
    await fastify.authenticate(request)
  })
})
