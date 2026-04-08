import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { supabase } from '../config/supabase.js'

const AUDITABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

export default fp(async (fastify: FastifyInstance) => {
  fastify.addHook('onResponse', async (request, reply) => {
    if (!AUDITABLE_METHODS.includes(request.method)) return
    if (!request.authUser) return
    if (reply.statusCode >= 400) return

    const urlParts = request.url.replace('/api/', '').split('/')
    const moduleName = urlParts[0] || 'unknown'

    const actionMap: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    }

    await supabase.from('audit_logs').insert({
      branch_id: request.authUser.branch_id,
      user_id: request.authUser.id,
      action: actionMap[request.method] || request.method.toLowerCase(),
      module: moduleName,
      entity_type: moduleName,
      entity_id: urlParts[1] || null,
      details: {
        method: request.method,
        url: request.url,
        status: reply.statusCode,
      },
    })
  })
})
