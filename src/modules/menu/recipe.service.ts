import { supabase } from '../../config/supabase.js'
import { handleSupabaseError } from '../../common/db.js'

export const recipeService = {
  async setRecipe(menuItemId: string, ingredients: Array<{ inventory_item_id: string; quantity: number }>) {
    const { error: deleteError } = await supabase.from('recipes').delete().eq('menu_item_id', menuItemId)
    handleSupabaseError(deleteError)

    if (ingredients.length > 0) {
      const { error } = await supabase.from('recipes').insert(
        ingredients.map((ingredient) => ({
          menu_item_id: menuItemId,
          inventory_item_id: ingredient.inventory_item_id,
          quantity: ingredient.quantity,
        })),
      )
      handleSupabaseError(error)
    }

    return { success: true }
  },
}
