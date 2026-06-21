import { z } from 'zod'

export const brandCreateSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  // Nullable to match the schema's `logo_url text null`; renders the name when null.
  logoUrl: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const brandUpdateSchema = brandCreateSchema.partial()

export type BrandCreateInput = z.infer<typeof brandCreateSchema>
export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>
