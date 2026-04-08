import type { FastifyInstance } from 'fastify'
import { requireBranch } from '../../common/guards.js'
import { closeShiftSchema, openShiftSchema } from './shifts.schema.js'
import { shiftsService } from './shifts.service.js'

export default async function shiftRoutes(app: FastifyInstance) {
  app.post('/shifts/open', async (request) => {
    const body = openShiftSchema.parse(request.body)
    return shiftsService.open(requireBranch(request), request.authUser.employee_id ?? request.authUser.id, body.opening_amount)
  })

  app.post('/shifts/close', async (request) => {
    const body = closeShiftSchema.parse(request.body)
    return shiftsService.close(requireBranch(request), request.authUser.employee_id ?? request.authUser.id, body.closing_amount)
  })

  app.get('/shifts/current', async (request) => {
    return shiftsService.getCurrent(requireBranch(request), request.authUser.employee_id ?? request.authUser.id)
  })

  app.get('/shifts/history', async (request) => {
    return shiftsService.getHistory(requireBranch(request))
  })
}
