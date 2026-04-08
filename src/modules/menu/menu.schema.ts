import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
})

export const itemSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  price: z.number().min(0),
  barcode: z.string().optional(),
  image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
})

export const comboSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  price: z.number().min(0),
  barcode: z.string().optional(),
  is_active: z.boolean().default(true),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).default([]),
})

export const recipeSchema = z.object({
  ingredients: z.array(z.object({
    inventory_item_id: z.string().uuid(),
    quantity: z.number().positive(),
  })),
})
