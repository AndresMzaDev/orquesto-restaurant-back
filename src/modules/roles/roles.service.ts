import { supabase } from '../../config/supabase.js'
import { ensureFound, handleSupabaseError } from '../../common/db.js'

export const rolesService = {
  async getAll(restaurantId: string) {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions(
          permission_id,
          permissions(*)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('name')

    handleSupabaseError(error)
    return data ?? []
  },

  async create(restaurantId: string, body: Record<string, unknown>) {
    const { permissions = [], ...roleBody } = body

    const { data, error } = await supabase
      .from('roles')
      .insert({ restaurant_id: restaurantId, ...roleBody })
      .select('*')
      .single()

    handleSupabaseError(error)
    const role = ensureFound(data, 'Rol')

    if (Array.isArray(permissions) && permissions.length > 0) {
      await supabase.from('role_permissions').insert(
        permissions.map((permissionId) => ({
          role_id: role.id,
          permission_id: permissionId,
        })),
      )
    }

    return role
  },

  async getById(id: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions(
          permission_id,
          permissions(*)
        )
      `)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    handleSupabaseError(error)
    return ensureFound(data, 'Rol')
  },

  async update(id: string, restaurantId: string, body: Record<string, unknown>) {
    const { permissions = [], ...roleBody } = body

    const { data, error } = await supabase
      .from('roles')
      .update(roleBody)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single()

    handleSupabaseError(error)
    const role = ensureFound(data, 'Rol')

    if (Array.isArray(permissions)) {
      await supabase.from('role_permissions').delete().eq('role_id', id)
      if (permissions.length > 0) {
        await supabase.from('role_permissions').insert(
          permissions.map((permissionId) => ({
            role_id: id,
            permission_id: permissionId,
          })),
        )
      }
    }

    return role
  },

  async delete(id: string, restaurantId: string) {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurantId)

    handleSupabaseError(error)
    return { success: true }
  },

  async getAllPermissions() {
    const { data, error } = await supabase.from('permissions').select('*').order('code')
    handleSupabaseError(error)
    return data ?? []
  },
}
