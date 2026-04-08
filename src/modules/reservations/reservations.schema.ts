import { z } from 'zod'

export const reservationSchema = z.object({
  customer_name: z.string().min(1),
  phone: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  guests: z.number().int().positive(),
  table_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
})
