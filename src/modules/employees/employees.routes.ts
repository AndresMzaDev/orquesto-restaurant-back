import type { FastifyInstance } from 'fastify'
import { requireMaster, requireRestaurant } from '../../common/guards.js'
import { employeesService } from './employees.service.js'
import { createEmployeeSchema, updateEmployeeSchema } from './employees.schema.js'

export default async function employeeRoutes(app: FastifyInstance) {
  app.get('/employees', async (request) => {
    requireMaster(request)
    return employeesService.getAll(requireRestaurant(request))
  })

  app.post('/employees', async (request) => {
    requireMaster(request)
    const body = createEmployeeSchema.parse(request.body)
    return employeesService.create(requireRestaurant(request), body)
  })

  app.get('/employees/:id', async (request) => {
    requireMaster(request)
    const { id } = request.params as { id: string }
    return employeesService.getById(id, requireRestaurant(request))
  })

  app.patch('/employees/:id', async (request) => {
    requireMaster(request)
    const { id } = request.params as { id: string }
    const body = updateEmployeeSchema.parse(request.body)
    return employeesService.update(id, requireRestaurant(request), body)
  })

  app.delete('/employees/:id', async (request) => {
    requireMaster(request)
    const { id } = request.params as { id: string }
    return employeesService.deactivate(id, requireRestaurant(request))
  })
}
