import dayjs from 'dayjs'
import { supabase } from '../../config/supabase.js'
import { BadRequestError, ForbiddenError } from '../../common/errors.js'
import { buildPaginatedResult, paginatedQuery } from '../../common/pagination.js'
import type { PaginationParams } from '../../common/types.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'
import { buildInvoiceSnapshot } from './invoice-snapshot.service.js'
import { shiftsService } from '../shifts/shifts.service.js'
import { ordersService } from '../orders/orders.service.js'
import { restoreInventoryForOrder } from '../inventory/stock.service.js'

async function generateInvoiceNumber(branchId: string) {
  const { data, error } = await supabase.rpc('generate_invoice_number', { branch_id: branchId })

  if (!error && data) return String(data)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const lastNumber = Number(String(invoice?.invoice_number ?? '0').split('-').pop() ?? '0')
  return String(lastNumber + 1).padStart(8, '0')
}

function assertCaiAvailability(branch: Record<string, any>, invoiceNumber: string) {
  if (dayjs(branch.cai_expiry).isBefore(dayjs(), 'day')) {
    throw new ForbiddenError('El CAI de la sucursal está vencido')
  }

  const start = Number(String(branch.cai_range_start).split('-').pop() ?? '0')
  const end = Number(String(branch.cai_range_end).split('-').pop() ?? '0')
  const current = Number(String(invoiceNumber).split('-').pop() ?? invoiceNumber)

  if (Number.isFinite(start) && Number.isFinite(end) && current > end) {
    throw new ForbiddenError('El rango de CAI está agotado')
  }
}

function computeInvoiceTotals(items: Array<Record<string, any>>, discountAmount: number, tipAmount: number) {
  const subtotal = items.reduce((total, item) => total + item.unit_price * item.quantity, 0)
  const taxAmount = items.reduce((total, item) => total + (item.unit_price * item.quantity * (item.tax_rate ?? 0)), 0)
  const total = subtotal + taxAmount + tipAmount - discountAmount

  return {
    subtotal,
    taxAmount,
    total,
  }
}

export const invoicesService = {
  async getAll(branchId: string, pagination: PaginationParams, filters: Record<string, unknown>) {
    const { from, to } = paginatedQuery(pagination)
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('branch_id', branchId)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.shift_id) query = query.eq('shift_id', filters.shift_id)

    const { data, error, count } = await query
    handleSupabaseError(error)
    return buildPaginatedResult(data ?? [], count ?? 0, pagination)
  },

  async getById(id: string, branchId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, payments:invoice_payments(*), splits:invoice_splits(*)')
      .eq('id', id)
      .eq('branch_id', branchId)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Factura')
  },

  async create(branchId: string, employeeId: string, body: { order_id: string; template_id?: string; customer_name?: string; customer_rtn?: string; payment_method: 'cash' | 'card' | 'mixed'; payments?: Array<{ method: 'cash' | 'card'; amount: number }>; discount_amount: number; tip_amount: number }) {
    const shift = await shiftsService.ensureOpenShift(branchId, employeeId)
    const order = await ordersService.getById(body.order_id, branchId)
    const items = order.items ?? []

    if (!items.length) {
      throw new BadRequestError('El pedido no tiene items')
    }

    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single()

    handleSupabaseError(branchError)
    const foundBranch = ensureFound(branch, 'Sucursal')

    const invoiceNumber = await generateInvoiceNumber(branchId)
    assertCaiAvailability(foundBranch, invoiceNumber)

    const templateId = body.template_id ?? (
      await supabase
        .from('invoice_templates')
        .select('id')
        .eq('is_default', true)
        .eq('is_active', true)
        .limit(1)
        .single()
    ).data?.id

    if (!templateId) {
      throw new BadRequestError('No hay plantilla de factura activa')
    }

    const { subtotal, taxAmount, total } = computeInvoiceTotals(items as Array<Record<string, any>>, body.discount_amount, body.tip_amount)
    const snapshot = await buildInvoiceSnapshot(body.order_id, branchId, templateId, employeeId)
    const payments =
      body.payment_method === 'mixed'
        ? body.payments ?? []
        : [{ method: body.payment_method as 'cash' | 'card', amount: total }]

    if (body.payment_method === 'mixed') {
      if (!payments.length) {
        throw new BadRequestError('Debe registrar al menos un pago cuando la factura es mixta')
      }

      const paymentTotal = payments.reduce((sum, payment) => sum + payment.amount, 0)
      if (Math.abs(paymentTotal - total) > 0.01) {
        throw new BadRequestError('La suma de pagos no coincide con el total de la factura')
      }
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        branch_id: branchId,
        cash_shift_id: shift.id,
        order_id: body.order_id,
        employee_id: employeeId,
        template_id: templateId,
        status: 'active',
        customer_name: body.customer_name ?? null,
        customer_rtn: body.customer_rtn ?? null,
        subtotal,
        tax: taxAmount,
        discount: body.discount_amount,
        tip: body.tip_amount,
        total,
        snapshot,
      })
      .select('*')
      .single()

    handleSupabaseError(error)
    const invoice = ensureFound(data, 'Factura')

    if (payments.length > 0) {
      const { error: paymentError } = await supabase.from('invoice_payments').insert(
        payments.map((payment) => ({
          invoice_id: invoice.id,
          method: payment.method,
          amount: payment.amount,
        })),
      )
      handleSupabaseError(paymentError)
    }

    const cashTotal = payments.filter((payment) => payment.method === 'cash').reduce((sum, payment) => sum + payment.amount, 0)
    const cardTotal = payments.filter((payment) => payment.method === 'card').reduce((sum, payment) => sum + payment.amount, 0)

    await supabase
      .from('cash_shifts')
      .update({
        cash_sales: (shift.cash_sales ?? 0) + cashTotal,
        card_sales: (shift.card_sales ?? 0) + cardTotal,
      })
      .eq('id', shift.id)

    await ordersService.finalizeClosure(body.order_id, branchId)
    return invoice
  },

  async void(id: string, branchId: string, employeeId: string, reason: string) {
    const invoice = await this.getById(id, branchId)

    if (invoice.status === 'voided') {
      throw new BadRequestError('La factura ya está anulada')
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'voided',
        void_reason: reason,
        voided_by: employeeId,
        voided_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('branch_id', branchId)
      .select('*')
      .single()

    handleSupabaseError(error)

    if (invoice.order_id) {
      await restoreInventoryForOrder(invoice.order_id, branchId)
    }

    if (invoice.cash_shift_id) {
      const payments = invoice.payments ?? []
      const cashTotal = payments.filter((payment: any) => payment.method === 'cash').reduce((sum: number, payment: any) => sum + payment.amount, 0)
      const cardTotal = payments.filter((payment: any) => payment.method === 'card').reduce((sum: number, payment: any) => sum + payment.amount, 0)

      const { data: shift } = await supabase.from('cash_shifts').select('cash_sales, card_sales').eq('id', invoice.cash_shift_id).single()
      await supabase
        .from('cash_shifts')
        .update({
          cash_sales: Math.max(0, (shift?.cash_sales ?? 0) - cashTotal),
          card_sales: Math.max(0, (shift?.card_sales ?? 0) - cardTotal),
        })
        .eq('id', invoice.cash_shift_id)
    }

    return ensureFound(data, 'Factura')
  },

  async split(id: string, branchId: string, splits: Array<{ method: 'cash' | 'card'; amount: number }>) {
    const invoice = await this.getById(id, branchId)
    const { error } = await supabase.from('invoice_splits').insert(
      splits.map((split) => ({
        invoice_id: invoice.id,
        method: split.method,
        amount: split.amount,
      })),
    )
    handleSupabaseError(error)
    return { success: true }
  },

  async reprint(id: string, branchId: string) {
    const invoice = await this.getById(id, branchId)
    return invoice.snapshot
  },

  async getTemplates(restaurantId: string) {
    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    handleSupabaseError(error)
    return data ?? []
  },

  async createTemplate(restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('invoice_templates')
      .insert({ restaurant_id: restaurantId, ...body })
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Plantilla')
  },

  async getTemplateById(id: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Plantilla')
  },

  async updateTemplate(id: string, restaurantId: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('invoice_templates')
      .update(body)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Plantilla')
  },

  async deleteTemplate(id: string, restaurantId: string) {
    const { error } = await supabase
      .from('invoice_templates')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(error)
    return { success: true }
  },
}
