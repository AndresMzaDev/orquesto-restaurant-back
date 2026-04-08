import { z } from 'zod'

export const createInvoiceSchema = z.object({
  order_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  customer_name: z.string().trim().min(1).max(160).optional(),
  customer_rtn: z.string().trim().min(1).max(32).optional(),
  payment_method: z.enum(['cash', 'card', 'mixed']),
  payments: z.array(z.object({
    method: z.enum(['cash', 'card']),
    amount: z.number().positive(),
  })).optional(),
  discount_amount: z.number().min(0).default(0),
  tip_amount: z.number().min(0).default(0),
})

export const voidInvoiceSchema = z.object({
  reason: z.string().min(1),
})

export const splitInvoiceSchema = z.object({
  splits: z.array(z.object({
    method: z.enum(['cash', 'card']),
    amount: z.number().positive(),
  })).min(1),
})

export const invoiceTemplateSchema = z.object({
  name: z.string().min(1),
  header_config: z.record(z.any()),
  body_config: z.record(z.any()),
  footer_config: z.record(z.any()),
  paper_width_mm: z.union([z.literal(58), z.literal(80)]),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
})
