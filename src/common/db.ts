import type { PostgrestError } from '@supabase/supabase-js'
import { BadRequestError, NotFoundError } from './errors.js'

export function handleSupabaseError(error: PostgrestError | null) {
  if (error) throw new BadRequestError(error.message)
}

export function ensureFound<T>(data: T | null, entity: string): T {
  if (!data) throw new NotFoundError(entity)
  return data
}

export function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  return String(value).toLowerCase() === 'true'
}
