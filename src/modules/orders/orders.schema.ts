import { z } from 'zod'

export const createOrderSchema = z.object({
  type: z.enum(['dine_in', 'walk_in']),
  table_id: z.string().uuid().nullable().optional(),
})

export const addOrderItemSchema = z.object({
  menu_item_id: z.string().uuid().nullable().optional(),
  combo_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
})

export const updateOrderItemStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'delivered']),
})
