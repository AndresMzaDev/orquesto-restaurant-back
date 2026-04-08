import type { FastifyInstance } from 'fastify'
import authRoutes from './modules/auth/auth.routes.js'
import restaurantRoutes from './modules/restaurants/restaurants.routes.js'
import branchRoutes from './modules/branches/branches.routes.js'
import employeeRoutes from './modules/employees/employees.routes.js'
import roleRoutes from './modules/roles/roles.routes.js'
import inventoryRoutes from './modules/inventory/inventory.routes.js'
import menuRoutes from './modules/menu/menu.routes.js'
import tableRoutes from './modules/tables/tables.routes.js'
import reservationRoutes from './modules/reservations/reservations.routes.js'
import orderRoutes from './modules/orders/orders.routes.js'
import invoiceRoutes from './modules/invoices/invoices.routes.js'
import shiftRoutes from './modules/shifts/shifts.routes.js'
import kitchenRoutes from './modules/kitchen/kitchen.routes.js'
import expenseRoutes from './modules/expenses/expenses.routes.js'
import notificationRoutes from './modules/notifications/notifications.routes.js'
import reportRoutes from './modules/reports/reports.routes.js'
import auditRoutes from './modules/audit/audit.routes.js'

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes)
  await app.register(restaurantRoutes)
  await app.register(branchRoutes)
  await app.register(employeeRoutes)
  await app.register(roleRoutes)
  await app.register(inventoryRoutes)
  await app.register(menuRoutes)
  await app.register(tableRoutes)
  await app.register(reservationRoutes)
  await app.register(orderRoutes)
  await app.register(invoiceRoutes)
  await app.register(shiftRoutes)
  await app.register(kitchenRoutes)
  await app.register(expenseRoutes)
  await app.register(notificationRoutes)
  await app.register(reportRoutes)
  await app.register(auditRoutes)
}
