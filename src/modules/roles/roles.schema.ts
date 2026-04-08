import { z } from 'zod'

export const createRoleSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string().uuid()).default([]),
  is_system: z.boolean().default(false),
})

export const updateRoleSchema = createRoleSchema.partial()
