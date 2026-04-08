import { z } from 'zod'

export const openShiftSchema = z.object({
  opening_amount: z.number().min(0),
})

export const closeShiftSchema = z.object({
  closing_amount: z.number().min(0),
})
