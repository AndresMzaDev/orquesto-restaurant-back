import type { FastifyInstance } from 'fastify'
import { requireBranch, requirePermission, requireRestaurant } from '../../common/guards.js'
import { getPaginationParams } from '../../common/pagination.js'
import { inventoryService } from './inventory.service.js'
import { categorySchema, createItemSchema, createMovementSchema, updateItemSchema } from './inventory.schema.js'
import type { CreateMovementInput } from './inventory.schema.js'

export default async function inventoryRoutes(app: FastifyInstance) {
  app.get('/inventory/categories', async (request) => {
    requirePermission(request, 'inventory:view')
    return inventoryService.getCategories(requireRestaurant(request))
  })

  app.post('/inventory/categories', async (request) => {
    requirePermission(request, 'inventory:create')
    const body = categorySchema.parse(request.body)
    return inventoryService.createCategory(requireRestaurant(request), body)
  })

  app.patch('/inventory/categories/:id', async (request) => {
    requirePermission(request, 'inventory:edit')
    const { id } = request.params as { id: string }
    const body = categorySchema.partial().parse(request.body)
    return inventoryService.updateCategory(id, requireRestaurant(request), body)
  })

  app.delete('/inventory/categories/:id', async (request) => {
    requirePermission(request, 'inventory:delete')
    const { id } = request.params as { id: string }
    return inventoryService.deleteCategory(id, requireRestaurant(request))
  })

  app.get('/inventory/items', async (request) => {
    requirePermission(request, 'inventory:view')
    const query = request.query as Record<string, unknown>
    return inventoryService.getItems(requireRestaurant(request), requireBranch(request), getPaginationParams(query), query)
  })

  app.post('/inventory/items', async (request) => {
    requirePermission(request, 'inventory:create')
    const body = createItemSchema.parse(request.body)
    return inventoryService.createItem(requireRestaurant(request), body)
  })

  app.get('/inventory/items/:id', async (request) => {
    requirePermission(request, 'inventory:view')
    const { id } = request.params as { id: string }
    return inventoryService.getItemById(id, requireRestaurant(request))
  })

  app.patch('/inventory/items/:id', async (request) => {
    requirePermission(request, 'inventory:edit')
    const { id } = request.params as { id: string }
    const body = updateItemSchema.parse(request.body)
    return inventoryService.updateItem(id, requireRestaurant(request), body)
  })

  app.delete('/inventory/items/:id', async (request) => {
    requirePermission(request, 'inventory:delete')
    const { id } = request.params as { id: string }
    return inventoryService.deleteItem(id, requireRestaurant(request))
  })

  app.get('/inventory/items/search', async (request) => {
    requirePermission(request, 'inventory:view')
    const { barcode } = request.query as { barcode: string }
    return inventoryService.findByBarcode(requireRestaurant(request), barcode)
  })

  app.get('/inventory/stock', async (request) => {
    requirePermission(request, 'inventory:view')
    return inventoryService.getStock(requireBranch(request))
  })

  app.post('/inventory/movements', async (request) => {
    requirePermission(request, 'inventory:movements')
    const body = createMovementSchema.parse(request.body) as CreateMovementInput
    return inventoryService.createMovement(requireBranch(request), request.authUser.id, body)
  })
}
