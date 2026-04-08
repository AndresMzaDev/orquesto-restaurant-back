import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'
import { BadRequestError } from '../../common/errors.js'

export const employeesService = {
  async getAll(restaurantId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        user:users(id, email),
        role:roles(*),
        branch:branches(*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    handleSupabaseError(error)
    return data ?? []
  },

  async create(restaurantId: string, body: Record<string, unknown>) {
    // 1. Crear el usuario en Supabase Auth para que pueda hacer login
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: String(body.email),
      password: String(body.password),
      email_confirm: true,
    })

    if (authError || !authData.user) {
      throw new BadRequestError(authError?.message ?? 'No se pudo crear el usuario en Auth')
    }

    const authUserId = authData.user.id

    // 2. Insertar en la tabla users con el mismo id de Auth
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: body.email,
        is_master: false,
      })
      .select('id, email, is_master')
      .single()

    if (userError) {
      // Rollback: eliminar el usuario de Auth si falla la inserción
      await supabase.auth.admin.deleteUser(authUserId)
      handleSupabaseError(userError)
    }

    const createdUser = ensureFound(user, 'Usuario')

    const employeePayload = {
      user_id: createdUser.id,
      restaurant_id: restaurantId,
      branch_id: body.branch_id,
      role_id: body.role_id,
      first_name: body.first_name,
      last_name: body.last_name,
      position: body.position,
      phone: body.phone ?? null,
      salary: body.salary,
      is_active: body.is_active,
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(employeePayload)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Empleado')
  },

  async getById(id: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        user:users(id, email),
        role:roles(*),
        branch:branches(*)
      `)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Empleado')
  },

  async update(id: string, restaurantId: string, body: Record<string, unknown>) {
    const employee = await this.getById(id, restaurantId)

    if (body.email || body.password) {
      const authPayload: Record<string, unknown> = {}
      if (body.email) authPayload.email = body.email
      if (body.password) authPayload.password = body.password

      const { error: authError } = await supabase.auth.admin.updateUserById(
        String(employee.user_id ?? employee.user?.id),
        authPayload,
      )
      if (authError) handleSupabaseError(authError as any)

      if (body.email) {
        const { error: userError } = await supabase
          .from('users')
          .update({ email: body.email })
          .eq('id', employee.user_id ?? employee.user?.id)
        handleSupabaseError(userError)
      }
    }

    const { data, error } = await supabase
      .from('employees')
      .update({
        branch_id: body.branch_id,
        role_id: body.role_id,
        first_name: body.first_name,
        last_name: body.last_name,
        position: body.position,
        phone: body.phone,
        salary: body.salary,
        is_active: body.is_active,
      })
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Empleado')
  },

  async deactivate(id: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('employees')
      .update({ is_active: false })
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Empleado')
  },
}
