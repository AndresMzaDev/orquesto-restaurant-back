import type { FastifyInstance } from 'fastify'
import { getPaginationParams } from '../../common/pagination.js'
import { requireBranch, requireMaster, requirePermission, requireRestaurant } from '../../common/guards.js'
import { createInvoiceSchema, invoiceTemplateSchema, splitInvoiceSchema, voidInvoiceSchema } from './invoices.schema.js'
import { invoicesService } from './invoices.service.js'

export default async function invoiceRoutes(app: FastifyInstance) {
  app.get('/invoices', async (request) => {
    requirePermission(request, 'invoices:view')
    const query = request.query as Record<string, unknown>
    return invoicesService.getAll(requireBranch(request), getPaginationParams(query), query)
  })

  app.post('/invoices', async (request) => {
    requirePermission(request, 'invoices:create')
    const body = createInvoiceSchema.parse(request.body)
    return invoicesService.create(requireBranch(request), request.authUser.employee_id ?? request.authUser.id, body)
  })

  app.get('/invoices/:id', async (request) => {
    requirePermission(request, 'invoices:view')
    const { id } = request.params as { id: string }
    return invoicesService.getById(id, requireBranch(request))
  })

  app.post('/invoices/:id/void', async (request) => {
    requirePermission(request, 'invoices:void')
    const { id } = request.params as { id: string }
    const body = voidInvoiceSchema.parse(request.body)
    return invoicesService.void(id, requireBranch(request), request.authUser.employee_id ?? request.authUser.id, body.reason)
  })

  app.post('/invoices/:id/split', async (request) => {
    requirePermission(request, 'invoices:create')
    const { id } = request.params as { id: string }
    const body = splitInvoiceSchema.parse(request.body)
    return invoicesService.split(id, requireBranch(request), body.splits)
  })

  app.get('/invoices/:id/reprint', async (request) => {
    requirePermission(request, 'invoices:view')
    const { id } = request.params as { id: string }
    return invoicesService.reprint(id, requireBranch(request))
  })

  app.get('/invoice-templates', async (request) => {
    return invoicesService.getTemplates(requireRestaurant(request))
  })

  app.post('/invoice-templates', async (request) => {
    requireMaster(request)
    return invoicesService.createTemplate(requireRestaurant(request), invoiceTemplateSchema.parse(request.body))
  })

  app.get('/invoice-templates/:id', async (request) => {
    const { id } = request.params as { id: string }
    return invoicesService.getTemplateById(id, requireRestaurant(request))
  })

  app.patch('/invoice-templates/:id', async (request) => {
    requireMaster(request)
    const { id } = request.params as { id: string }
    return invoicesService.updateTemplate(id, requireRestaurant(request), invoiceTemplateSchema.partial().parse(request.body))
  })

  app.delete('/invoice-templates/:id', async (request) => {
    requireMaster(request)
    const { id } = request.params as { id: string }
    return invoicesService.deleteTemplate(id, requireRestaurant(request))
  })
}
