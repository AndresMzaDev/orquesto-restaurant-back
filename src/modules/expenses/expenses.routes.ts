import type { FastifyInstance } from 'fastify'
import { requireBranch, requirePermission, requireRestaurant } from '../../common/guards.js'
import { expenseCategorySchema, expenseSchema } from './expenses.schema.js'
import { expensesService } from './expenses.service.js'

export default async function expenseRoutes(app: FastifyInstance) {
  app.get('/expense-categories', async (request) => {
    requirePermission(request, 'expenses:view')
    return expensesService.getCategories(requireRestaurant(request))
  })

  app.post('/expense-categories', async (request) => {
    requirePermission(request, 'expenses:create')
    return expensesService.createCategory(requireRestaurant(request), expenseCategorySchema.parse(request.body))
  })

  app.patch('/expense-categories/:id', async (request) => {
    requirePermission(request, 'expenses:create')
    const { id } = request.params as { id: string }
    return expensesService.updateCategory(id, requireRestaurant(request), expenseCategorySchema.partial().parse(request.body))
  })

  app.delete('/expense-categories/:id', async (request) => {
    requirePermission(request, 'expenses:delete')
    const { id } = request.params as { id: string }
    return expensesService.deleteCategory(id, requireRestaurant(request))
  })

  app.get('/expenses', async (request) => {
    requirePermission(request, 'expenses:view')
    return expensesService.getAll(requireBranch(request))
  })

  app.post('/expenses', async (request) => {
    requirePermission(request, 'expenses:create')
    return expensesService.create(requireBranch(request), request.authUser.id, expenseSchema.parse(request.body))
  })

  app.delete('/expenses/:id', async (request) => {
    requirePermission(request, 'expenses:delete')
    const { id } = request.params as { id: string }
    return expensesService.delete(id, requireBranch(request))
  })
}
