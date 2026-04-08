import type { FastifyInstance } from 'fastify'
import { requireBranch, requirePermission } from '../../common/guards.js'
import { tableSchema } from './tables.schema.js'
import { tablesService } from './tables.service.js'

export default async function tableRoutes(app: FastifyInstance) {
  app.get('/tables', async (request) => {
    requirePermission(request, 'tables:view')
    return tablesService.getAll(requireBranch(request))
  })

  app.post('/tables', async (request) => {
    requirePermission(request, 'tables:manage')
    return tablesService.create(requireBranch(request), tableSchema.parse(request.body))
  })

  app.patch('/tables/:id', async (request) => {
    requirePermission(request, 'tables:manage')
    const { id } = request.params as { id: string }
    return tablesService.update(id, requireBranch(request), tableSchema.partial().parse(request.body))
  })

  app.delete('/tables/:id', async (request) => {
    requirePermission(request, 'tables:manage')
    const { id } = request.params as { id: string }
    return tablesService.delete(id, requireBranch(request))
  })
}
