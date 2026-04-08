import type { FastifyInstance } from 'fastify'
import { getPaginationParams } from '../../common/pagination.js'
import { requirePermission, requireRestaurant } from '../../common/guards.js'
import { comboService } from './combo.service.js'
import { menuService } from './menu.service.js'
import { recipeService } from './recipe.service.js'
import { categorySchema, comboSchema, itemSchema, recipeSchema } from './menu.schema.js'

export default async function menuRoutes(app: FastifyInstance) {
  app.get('/menu/categories', async (request) => {
    requirePermission(request, 'menu:view')
    return menuService.getCategories(requireRestaurant(request))
  })

  app.post('/menu/categories', async (request) => {
    requirePermission(request, 'menu:create')
    return menuService.createCategory(requireRestaurant(request), categorySchema.parse(request.body))
  })

  app.patch('/menu/categories/:id', async (request) => {
    requirePermission(request, 'menu:edit')
    const { id } = request.params as { id: string }
    return menuService.updateCategory(id, requireRestaurant(request), categorySchema.partial().parse(request.body))
  })

  app.delete('/menu/categories/:id', async (request) => {
    requirePermission(request, 'menu:delete')
    const { id } = request.params as { id: string }
    return menuService.deleteCategory(id, requireRestaurant(request))
  })

  app.get('/menu/items', async (request) => {
    requirePermission(request, 'menu:view')
    const query = request.query as Record<string, unknown>
    return menuService.getItems(requireRestaurant(request), getPaginationParams(query), query)
  })

  app.post('/menu/items', async (request) => {
    requirePermission(request, 'menu:create')
    return menuService.createItem(requireRestaurant(request), itemSchema.parse(request.body))
  })

  app.get('/menu/items/:id', async (request) => {
    requirePermission(request, 'menu:view')
    const { id } = request.params as { id: string }
    return menuService.getItemById(id, requireRestaurant(request))
  })

  app.patch('/menu/items/:id', async (request) => {
    requirePermission(request, 'menu:edit')
    const { id } = request.params as { id: string }
    return menuService.updateItem(id, requireRestaurant(request), itemSchema.partial().parse(request.body))
  })

  app.delete('/menu/items/:id', async (request) => {
    requirePermission(request, 'menu:delete')
    const { id } = request.params as { id: string }
    return menuService.deleteItem(id, requireRestaurant(request))
  })

  app.get('/menu/items/search', async (request) => {
    requirePermission(request, 'menu:view')
    const { barcode } = request.query as { barcode: string }
    return menuService.findByBarcode(requireRestaurant(request), barcode)
  })

  app.put('/menu/items/:id/recipe', async (request) => {
    requirePermission(request, 'menu:edit')
    const { id } = request.params as { id: string }
    const body = recipeSchema.parse(request.body)
    return recipeService.setRecipe(id, body.ingredients)
  })

  app.get('/combos', async (request) => {
    requirePermission(request, 'menu:view')
    return comboService.getAll(requireRestaurant(request))
  })

  app.post('/combos', async (request) => {
    requirePermission(request, 'menu:create')
    return comboService.create(requireRestaurant(request), comboSchema.parse(request.body))
  })

  app.get('/combos/:id', async (request) => {
    requirePermission(request, 'menu:view')
    const { id } = request.params as { id: string }
    return comboService.getById(id, requireRestaurant(request))
  })

  app.patch('/combos/:id', async (request) => {
    requirePermission(request, 'menu:edit')
    const { id } = request.params as { id: string }
    return comboService.update(id, requireRestaurant(request), comboSchema.partial().parse(request.body))
  })

  app.delete('/combos/:id', async (request) => {
    requirePermission(request, 'menu:delete')
    const { id } = request.params as { id: string }
    return comboService.delete(id, requireRestaurant(request))
  })
}
