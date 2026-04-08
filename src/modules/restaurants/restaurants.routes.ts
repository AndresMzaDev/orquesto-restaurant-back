import type { FastifyInstance } from 'fastify'
import { requireMaster, requireRestaurant } from '../../common/guards.js'
import { restaurantsService } from './restaurants.service.js'
import { updateRestaurantSchema } from './restaurants.schema.js'

export default async function restaurantRoutes(app: FastifyInstance) {
  app.get('/restaurants/own', async (request) => {
    const restaurantId = requireRestaurant(request)
    return restaurantsService.getById(restaurantId)
  })

  app.get('/restaurants/:id', async (request) => {
    const { id } = request.params as { id: string }
    return restaurantsService.getById(id)
  })

  app.patch('/restaurants/:id', async (request) => {
    requireMaster(request)
    const { id } = request.params as { id: string }
    const body = updateRestaurantSchema.parse(request.body)
    return restaurantsService.update(id, body)
  })
}
