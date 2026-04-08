import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { supabase } from '../config/supabase.js'

export default fp(async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', async (request) => {
    if (!request.authUser) return

    if (request.authUser.is_master) {
      // Resolver restaurant_id
      if (!request.authUser.restaurant_id) {
        const queryRestaurantId = (request.query as Record<string, string | undefined>)?.restaurant_id
        if (queryRestaurantId) {
          request.authUser.restaurant_id = queryRestaurantId
        } else {
          const { data } = await supabase.from('restaurants').select('id').limit(1).single()
          if (data) request.authUser.restaurant_id = data.id
        }
      }

      // Resolver branch_id: primero desde header, luego auto-seleccionar la primera sucursal
      if (!request.authUser.branch_id) {
        const branchHeader = request.headers['x-branch-id'] as string | undefined
        if (branchHeader) {
          request.authUser.branch_id = branchHeader
        } else if (request.authUser.restaurant_id) {
          const { data } = await supabase
            .from('branches')
            .select('id')
            .eq('restaurant_id', request.authUser.restaurant_id)
            .limit(1)
            .single()
          if (data) request.authUser.branch_id = data.id
        }
      }
    }
  })
})
