'use client'

import { useActionState, useId, useState } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Check, Link2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { ImageUploadField } from './image-upload-field'
import { Field, FormActions, FormSection } from './form-shell'
import type { ProjectFormState } from '@/app/admin/(dashboard)/projects/actions'

/** Slugify a title the same shape the validator enforces: `Brand Refresh` → `brand-refresh`. */
function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface ProjectFormValues {
  title?: string
  slug?: string
  client?: string
  category?: string
  industry?: string
  year?: string
  imageUrl?: string
  summary?: string
  featured?: boolean
  sortOrder?: number
  published?: boolean
}

export interface ProjectFormProps {
  /** Bound Server Action (create, or update.bind(null, id)). */
  action: (
    state: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>
  /** Category options (from `projectCategories`). */
  categories: readonly string[]
  /** Existing values in edit mode. */
  defaultValues?: ProjectFormValues
  mode: 'create' | 'edit'
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'group inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-card',
        'transition-[transform,box-shadow,opacity] duration-200 ease-smooth',
        'hover:shadow-elevated active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Saving…
        </>
      ) : (
        <>
          <Check className="size-4" aria-hidden />
          {mode === 'create' ? 'Create project' : 'Save changes'}
        </>
      )}
    </button>
  )
}

export function ProjectForm({
  action,
  categories,
  defaultValues,
  mode,
}: ProjectFormProps) {
  const formId = useId()
  const [state, formAction] = useActionState<ProjectFormState, FormData>(
    action,
    {},
  )

  // Slug auto-generates from the title until the admin edits it by hand.
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [slug, setSlug] = useState(defaultValues?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug))
  const [category, setCategory] = useState(defaultValues?.category ?? '')
  const [featured, setFeatured] = useState(defaultValues?.featured ?? false)
  const [published, setPublished] = useState(defaultValues?.published ?? true)

  const fieldErrors = state.fieldErrors ?? {}

  // Form-level error → toast (e.g. duplicate slug surfaced at form scope).
  if (state.formError) {
    toast.error(state.formError)
  }

  function onTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {/* Identity */}
      <FormSection
        title="Identity"
        description="Title, URL slug, client, and how it's categorised."
        index={0}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id={`${formId}-title`}
            label="Title"
            required
            error={fieldErrors.title}
          >
            <Input
              id={`${formId}-title`}
              name="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Brand identity refresh"
              aria-invalid={fieldErrors.title ? true : undefined}
              autoComplete="off"
            />
          </Field>

          <Field
            id={`${formId}-slug`}
            label="Slug"
            required
            hint="lowercase-with-dashes"
            error={fieldErrors.slug}
          >
            <div className="relative">
              <Link2
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id={`${formId}-slug`}
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                placeholder="brand-identity-refresh"
                aria-invalid={fieldErrors.slug ? true : undefined}
                className="pl-8"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </Field>

          <Field
            id={`${formId}-client`}
            label="Client"
            required
            error={fieldErrors.client}
          >
            <Input
              id={`${formId}-client`}
              name="client"
              defaultValue={defaultValues?.client ?? ''}
              placeholder="Acme Co."
              aria-invalid={fieldErrors.client ? true : undefined}
              autoComplete="off"
            />
          </Field>

          <Field
            id={`${formId}-category`}
            label="Category"
            required
            error={fieldErrors.category}
          >
            {/* Mirror the controlled value into a hidden input so it posts via formData. */}
            <input type="hidden" name="category" value={category} />
            <Select
              value={category || undefined}
              onValueChange={(v) => setCategory(String(v ?? ''))}
            >
              <SelectTrigger
                id={`${formId}-category`}
                className="h-9 w-full"
                aria-invalid={fieldErrors.category ? true : undefined}
              >
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            id={`${formId}-industry`}
            label="Industry"
            required
            error={fieldErrors.industry}
          >
            <Input
              id={`${formId}-industry`}
              name="industry"
              defaultValue={defaultValues?.industry ?? ''}
              placeholder="Hospitality"
              aria-invalid={fieldErrors.industry ? true : undefined}
              autoComplete="off"
            />
          </Field>

          <Field
            id={`${formId}-year`}
            label="Year"
            required
            error={fieldErrors.year}
          >
            <Input
              id={`${formId}-year`}
              name="year"
              defaultValue={defaultValues?.year ?? ''}
              placeholder="2025"
              aria-invalid={fieldErrors.year ? true : undefined}
              autoComplete="off"
            />
          </Field>
        </div>
      </FormSection>

      {/* Cover image */}
      <FormSection
        title="Cover"
        description="Shown on the work grid and project detail (4:3 landscape)."
        index={1}
      >
        <ImageUploadField
          name="imageUrl"
          entity="projects"
          defaultValue={defaultValues?.imageUrl}
          label="Cover image"
          description="A landscape crop renders best."
          aspect="4 / 3"
          error={fieldErrors.imageUrl}
        />
      </FormSection>

      {/* Summary */}
      <FormSection
        title="Summary"
        description="A short description shown alongside the project."
        index={2}
      >
        <Field
          id={`${formId}-summary`}
          label="Summary"
          required
          error={fieldErrors.summary}
        >
          <Textarea
            id={`${formId}-summary`}
            name="summary"
            defaultValue={defaultValues?.summary ?? ''}
            placeholder="A short paragraph about the work delivered…"
            rows={4}
            aria-invalid={fieldErrors.summary ? true : undefined}
          />
        </Field>
      </FormSection>

      {/* Visibility */}
      <FormSection
        title="Visibility"
        description="Control where this project appears and its position."
        index={3}
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Switch posts "on" when checked — read as `=== 'on'` server-side. */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/50 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  Published
                </span>
                <span className="text-xs text-muted-foreground">
                  When on, this project shows on the public site.
                </span>
              </div>
              <Switch
                name="published"
                checked={published}
                onCheckedChange={(v) => setPublished(Boolean(v))}
                aria-label="Published"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/50 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  Featured
                </span>
                <span className="text-xs text-muted-foreground">
                  Surfaces this project on the homepage.
                </span>
              </div>
              <Switch
                name="featured"
                checked={featured}
                onCheckedChange={(v) => setFeatured(Boolean(v))}
                aria-label="Featured"
              />
            </div>
          </div>

          <Field
            id={`${formId}-sortOrder`}
            label="Sort order"
            hint="lower = earlier"
            error={fieldErrors.sortOrder}
            className="sm:w-40"
          >
            <Input
              id={`${formId}-sortOrder`}
              name="sortOrder"
              type="number"
              min={0}
              step={1}
              defaultValue={defaultValues?.sortOrder ?? 0}
              aria-invalid={fieldErrors.sortOrder ? true : undefined}
              className="h-9 tabular-nums"
            />
          </Field>
        </div>
      </FormSection>

      <FormActions>
        <Link
          href="/admin/projects"
          className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-[0.98]"
        >
          Cancel
        </Link>
        <SubmitButton mode={mode} />
      </FormActions>
    </form>
  )
}
