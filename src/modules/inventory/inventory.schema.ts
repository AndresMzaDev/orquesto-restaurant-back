import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1).max(255),
  sort_order: z.number().int().min(0).default(0),
})

export const createItemSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(255),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit_name: z.string().default('unidad'),
  track_type: z.enum(['unit', 'package']).default('unit'),
  is_auto_deduct: z.boolean().default(true),
  stock_min: z.number().min(0).default(0),
  price_cost: z.number().min(0).default(0),
  image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
})

export const updateItemSchema = createItemSchema.partial()

export const createMovementSchema = z.object({
  item_id: z.string().uuid(),
  type: z.enum(['entry', 'exit', 'adjustment']),
  quantity: z.number().refine((value) => value !== 0, 'La cantidad no puede ser cero'),
  reason: z.string().optional(),
})

export type CreateMovementInput = z.infer<typeof createMovementSchema>
