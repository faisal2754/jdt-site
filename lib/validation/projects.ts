import { z } from 'zod'

import { projectCategories, type ProjectCategory } from '@/lib/projects'
import { slugSchema } from '@/lib/validation/creators'

export const projectCategoryValues: readonly [
  ProjectCategory,
  ...ProjectCategory[],
] = projectCategories as [ProjectCategory, ...ProjectCategory[]]

export const projectCreateSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1, 'Title is required.'),
  client: z.string().min(1, 'Client is required.'),
  category: z.enum(projectCategoryValues),
  industry: z.string().min(1, 'Industry is required.'),
  year: z.string().min(1, 'Year is required.'),
  imageUrl: z.string().min(1, 'Image is required.'),
  summary: z.string().min(1, 'Summary is required.'),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
})

export const projectUpdateSchema = projectCreateSchema.partial()

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>
