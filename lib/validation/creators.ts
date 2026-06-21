import { z } from 'zod'

import { creatorCategories } from '@/lib/creators'

/** Lowercase, url-safe slug: `marcus-cole`, `jay-rivers`. */
export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase and url-safe (e.g. "marcus-cole").',
  )

/**
 * Real creator categories — `creatorCategories` leads with the "All" filter
 * pseudo-category, which is never stored on a row, so exclude it here.
 */
export const creatorCategoryValues = creatorCategories.filter(
  (c): c is Exclude<(typeof creatorCategories)[number], 'All'> => c !== 'All',
)

const statSchema = z.object({
  value: z.string().min(1, 'Stat value is required.'),
  label: z.string().min(1, 'Stat label is required.'),
})

const socialSchema = z.object({
  label: z.string().min(1, 'Social label is required.'),
  href: z.string().min(1, 'Social href is required.'),
  handle: z.string().optional(),
})

export const creatorCreateSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, 'Name is required.'),
  category: z.enum(creatorCategoryValues),
  location: z.string().min(1, 'Location is required.'),
  imageUrl: z.string().min(1, 'Image is required.'),
  bio: z.array(z.string().min(1, 'Bio paragraphs cannot be empty.')),
  stats: z.array(statSchema),
  socials: z.array(socialSchema),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
})

export const creatorUpdateSchema = creatorCreateSchema.partial()

export type CreatorCreateInput = z.infer<typeof creatorCreateSchema>
export type CreatorUpdateInput = z.infer<typeof creatorUpdateSchema>
