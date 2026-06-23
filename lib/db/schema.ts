import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Shared jsonb shapes
//
// These mirror the nested objects already used by the public site in
// `lib/creators.ts` and `lib/services.ts` exactly, so the schema-derived row
// types are drop-in compatible and seeding is lossless.
// ---------------------------------------------------------------------------

/** A creator's bio is an ordered list of paragraphs. */
export type Bio = string[]

/** A single stat shown on a creator profile, e.g. `{ value: "1.8M", label: "Instagram" }`. */
export type Stat = { value: string; label: string }

/** A social link on a creator profile. `handle` is optional in the existing data. */
export type Social = { label: string; href: string; handle?: string }

/**
 * Which audience a service item is aimed at. When every item in a category is
 * tagged, the public site renders the category as two columns
 * ("For Brands" / "For Influencers") instead of a single flat list.
 */
export type ServiceAudience = 'brands' | 'influencers'

/** A single service line item under a service category. */
export type ServiceItem = {
  name: string
  description: string
  audience?: ServiceAudience
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const creators = pgTable('creators', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  location: text('location').notNull(),
  imageUrl: text('image_url').notNull(),
  bio: jsonb('bio').$type<Bio>().notNull(),
  stats: jsonb('stats').$type<Stat[]>().notNull(),
  socials: jsonb('socials').$type<Social[]>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  client: text('client').notNull(),
  category: text('category').notNull(),
  industry: text('industry').notNull(),
  year: text('year').notNull(),
  imageUrl: text('image_url').notNull(),
  summary: text('summary').notNull(),
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  label: text('label').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  services: jsonb('services').$type<ServiceItem[]>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Row + insert types (single source of truth, re-derived by the public site)
// ---------------------------------------------------------------------------

export type Creator = InferSelectModel<typeof creators>
export type NewCreator = InferInsertModel<typeof creators>

export type Project = InferSelectModel<typeof projects>
export type NewProject = InferInsertModel<typeof projects>

export type ServiceCategory = InferSelectModel<typeof serviceCategories>
export type NewServiceCategory = InferInsertModel<typeof serviceCategories>

export type Brand = InferSelectModel<typeof brands>
export type NewBrand = InferInsertModel<typeof brands>
