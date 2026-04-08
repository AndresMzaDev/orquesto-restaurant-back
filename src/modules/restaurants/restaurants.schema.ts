import { z } from 'zod'

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).optional(),
  logo_url: z.string().url().nullable().optional(),
  currency: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
  tax_rate: z.number().min(0).optional(),
})
