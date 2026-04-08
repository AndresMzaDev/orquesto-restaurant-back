import { z } from 'zod'

export const tableSchema = z.object({
  branch_id: z.string().uuid().optional(),
  number: z.string().min(1),
  capacity: z.number().int().positive(),
  status: z.enum(['free', 'occupied', 'reserved', 'bill']).default('free'),
})
