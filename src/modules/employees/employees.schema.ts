import { z } from 'zod'

export const createEmployeeSchema = z.object({
  branch_id: z.string().uuid(),
  role_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  position: z.string().min(1),
  phone: z.string().min(1).optional(),
  salary: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
})

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
})
