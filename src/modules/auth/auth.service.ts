import { handleSupabaseError } from '../../common/db.js'
import { BadRequestError, UnauthorizedError } from '../../common/errors.js'
import { createSupabaseAuthClient, supabase } from '../../config/supabase.js'

export const authService = {
  async login(email: string, password: string) {
    const authClient = createSupabaseAuthClient()
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })

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

  async register(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      throw new BadRequestError(authError?.message ?? 'No se pudo crear la cuenta')
    }

    const authUserId = authData.user.id
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email,
        is_master: true,
      })
      .select('id, email, is_master')
      .single()

    if (userError) {
      await supabase.auth.admin.deleteUser(authUserId)
      handleSupabaseError(userError)
    }

    return {
      success: true,
      message: 'Cuenta creada. Ya puedes iniciar sesión.',
      user,
    }
  },
}
