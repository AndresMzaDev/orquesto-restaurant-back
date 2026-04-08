import { supabase } from '../../config/supabase.js'

export async function buildInvoiceSnapshot(
  orderId: string,
  branchId: string,
  templateId: string,
  employeeId: string,
) {
  const { data: branch } = await supabase
    .from('branches')
    .select('*, restaurant:restaurants(*)')
    .eq('id', branchId)
    .single()

  const { data: template } = await supabase
    .from('invoice_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  const { data: employee } = await supabase
    .from('employees')
    .select('first_name, last_name')
    .eq('id', employeeId)
    .single()

  return {
    restaurant: {
      name: branch?.restaurant?.name ?? '',
      logo_url: branch?.restaurant?.logo_url ?? null,
    },
    branch: {
      address: branch?.address ?? '',
      phone: branch?.phone ?? '',
      rtn: branch?.rtn ?? '',
      cai: branch?.cai_number ?? '',
    },
    template,
    items: items ?? [],
    employee_name: `${employee?.first_name ?? ''} ${employee?.last_name ?? ''}`.trim(),
    created_at: new Date().toISOString(),
  }
}
