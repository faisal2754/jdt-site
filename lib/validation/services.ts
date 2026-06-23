import { z } from 'zod'

import { slugSchema } from '@/lib/validation/creators'

const serviceItemSchema = z.object({
  name: z.string().min(1, 'Service name is required.'),
  description: z.string().min(1, 'Service description is required.'),
  // Optional audience tag. The admin form posts '' when unset, so coerce empty
  // (and null/undefined) to undefined before the enum check.
  audience: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.enum(['brands', 'influencers']).optional(),
  ),
})

export const serviceCreateSchema = z.object({
  slug: slugSchema,
  label: z.string().min(1, 'Label is required.'),
  tagline: z.string().min(1, 'Tagline is required.'),
  description: z.string().min(1, 'Description is required.'),
  imageUrl: z.string().min(1, 'Image is required.'),
  services: z.array(serviceItemSchema),
  sortOrder: z.number().int().min(0).default(0),
})

export const serviceUpdateSchema = serviceCreateSchema.partial()

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>
