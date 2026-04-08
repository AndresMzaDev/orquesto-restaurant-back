import { z } from 'zod'

export const expenseCategorySchema = z.object({
  name: z.string().min(1),
})

export const expenseSchema = z.object({
  category_id: z.string().uuid(),
  description: z.string().min(1),
  amount: z.number().positive(),
  expense_date: z.string().optional(),
})
