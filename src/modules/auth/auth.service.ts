import { supabase } from '../../config/supabase.js'
import { UnauthorizedError } from '../../common/errors.js'

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user || !data.session) {
      throw new UnauthorizedError('Credenciales inválidas')
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, is_master')
      .eq('id', data.user.id)
      .single()

    if (userError || !user) {
      throw new UnauthorizedError('Usuario no encontrado')
    }

    let employee: Record<string, any> | null = null

    if (!user.is_master) {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          *,
          role:roles(*),
          branch:branches(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (employeeError || !employeeData) {
        throw new UnauthorizedError('Empleado inactivo')
      }

      employee = employeeData
    }

    return {
      token: data.session.access_token,
      user: {
        id: user.id,
        email: user.email,
        is_master: user.is_master,
      },
      employee,
    }
  },
}
