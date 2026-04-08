import type { FastifyInstance } from 'fastify'
import { supabase } from '../../config/supabase.js'

export default async function authRoutes(app: FastifyInstance) {
  app.get('/auth/me', async (request) => {
    const authUser = request.authUser

    const user = {
      id: authUser.id,
      email: authUser.email,
      is_master: authUser.is_master,
    }

    if (authUser.is_master || !authUser.employee_id) {
      return { user, employee: null }
    }

    const { data: employee } = await supabase
      .from('employees')
      .select(`
        *,
        role:roles(*),
        branch:branches(*)
      `)
      .eq('id', authUser.employee_id)
      .single()

    return { user, employee: employee ?? null }
  })

  app.post('/auth/logout', async () => ({ success: true }))
}
