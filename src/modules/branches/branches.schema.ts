import { z } from 'zod'

export const createBranchSchema = z.object({
  restaurant_id: z.string().uuid().optional(),
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  rtn: z.string().optional().default(''),
  cai_number: z.string().optional().default(''),
  cai_range_start: z.string().optional().default(''),
  cai_range_end: z.string().optional().default(''),
  cai_expiry: z.string().optional().default(''),
  is_active: z.boolean().default(true),
})

export const updateBranchSchema = createBranchSchema.partial()
