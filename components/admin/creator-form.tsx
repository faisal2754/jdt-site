'use client'

import { useActionState, useId, useState } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Check, Link2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { ImageUploadField } from './image-upload-field'
import { RepeatableList } from './repeatable-list'
import { Field, FormActions, FormSection } from './form-shell'
import type { CreatorFormState } from '@/app/admin/(dashboard)/talent/actions'

/** Slugify a name the same shape the validator enforces: `Marcus Cole` → `marcus-cole`. */
function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface CreatorFormValues {
  name?: string
  slug?: string
  category?: string
  location?: string
  imageUrl?: string
  bio?: string[]
  stats?: { value: string; label: string }[]
  socials?: { label: string; href: string; handle?: string }[]
  sortOrder?: number
  published?: boolean
}

export interface CreatorFormProps {
  /** Bound Server Action (create, or update.bind(null, id)). */
  action: (
    state: CreatorFormState,
    formData: FormData,
  ) => Promise<CreatorFormState>
  /** Category options (already excludes the "All" pseudo-filter). */
  categories: readonly string[]
  /** Existing values in edit mode. */
  defaultValues?: CreatorFormValues
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
          {mode === 'create' ? 'Create talent' : 'Save changes'}
        </>
      )}
    </button>
  )
}

export function CreatorForm({
  action,
  categories,
  defaultValues,
  mode,
}: CreatorFormProps) {
  const formId = useId()
  const [state, formAction] = useActionState<CreatorFormState, FormData>(
    action,
    {},
  )

  // Slug auto-generates from the name until the admin edits it by hand.
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [slug, setSlug] = useState(defaultValues?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(
    Boolean(defaultValues?.slug),
  )
  const [category, setCategory] = useState(defaultValues?.category ?? '')
  const [published, setPublished] = useState(defaultValues?.published ?? true)

  const fieldErrors = state.fieldErrors ?? {}

  // Form-level error → toast (e.g. duplicate slug surfaced at form scope).
  if (state.formError) {
    toast.error(state.formError)
  }

  function onNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6"
      noValidate
    >
      {/* Identity */}
      <FormSection
        title="Identity"
        description="Name, URL slug, discipline, and base."
        index={0}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id={`${formId}-name`}
            label="Name"
            required
            error={fieldErrors.name}
          >
            <Input
              id={`${formId}-name`}
              name="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Marcus Cole"
              aria-invalid={fieldErrors.name ? true : undefined}
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
                placeholder="marcus-cole"
                aria-invalid={fieldErrors.slug ? true : undefined}
                className="pl-8"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
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
                <SelectValue placeholder="Choose a discipline" />
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
            id={`${formId}-location`}
            label="Location"
            required
            error={fieldErrors.location}
          >
            <Input
              id={`${formId}-location`}
              name="location"
              defaultValue={defaultValues?.location ?? ''}
              placeholder="Los Angeles, CA"
              aria-invalid={fieldErrors.location ? true : undefined}
              autoComplete="off"
            />
          </Field>
        </div>
      </FormSection>

      {/* Portrait */}
      <FormSection
        title="Portrait"
        description="Shown across the roster, carousel, and profile page (3:4 portrait)."
        index={1}
      >
        <ImageUploadField
          name="imageUrl"
          entity="creators"
          defaultValue={defaultValues?.imageUrl}
          label="Profile image"
          description="A portrait crop renders best."
          aspect="3 / 4"
          error={fieldErrors.imageUrl}
        />
      </FormSection>

      {/* Bio */}
      <FormSection
        title="Bio"
        description="One paragraph per row, in display order."
        index={2}
      >
        <RepeatableList
          name="bio"
          legend="Paragraphs"
          fields={[
            {
              key: 'text',
              label: 'Paragraph',
              as: 'textarea',
              placeholder: 'A short paragraph about this creator…',
            },
          ]}
          defaultValue={(defaultValues?.bio ?? []).map((text) => ({ text }))}
          addLabel="Add paragraph"
          emptyLabel="No bio paragraphs yet."
          error={fieldErrors.bio}
        />
      </FormSection>

      {/* Stats + Socials */}
      <FormSection
        title="Highlights"
        description="Headline stats and social links shown on the profile."
        index={3}
      >
        <RepeatableList
          name="stats"
          legend="Stats"
          description="e.g. 1.8M · Instagram"
          fields={[
            { key: 'value', label: 'Value', placeholder: '1.8M' },
            { key: 'label', label: 'Label', placeholder: 'Instagram' },
          ]}
          defaultValue={defaultValues?.stats}
          addLabel="Add stat"
          emptyLabel="No stats yet."
          error={fieldErrors.stats}
        />

        <RepeatableList
          name="socials"
          legend="Socials"
          description="Handle is optional."
          fields={[
            { key: 'label', label: 'Platform', placeholder: 'Instagram' },
            { key: 'href', label: 'URL', placeholder: 'https://…' },
            { key: 'handle', label: 'Handle', placeholder: '@marcus' },
          ]}
          defaultValue={defaultValues?.socials?.map((s) => ({
            label: s.label,
            href: s.href,
            handle: s.handle ?? '',
          }))}
          addLabel="Add social"
          emptyLabel="No socials yet."
          error={fieldErrors.socials}
        />
      </FormSection>

      {/* Visibility */}
      <FormSection
        title="Visibility"
        description="Control where this record appears and its position."
        index={4}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/50 px-4 py-3 sm:flex-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                Published
              </span>
              <span className="text-xs text-muted-foreground">
                When on, this talent shows on the public site.
              </span>
            </div>
            {/* Switch posts "on" when checked — read as `=== 'on'` server-side. */}
            <Switch
              name="published"
              checked={published}
              onCheckedChange={(v) => setPublished(Boolean(v))}
              aria-label="Published"
            />
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
          href="/admin/talent"
          className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-[0.98]"
        >
          Cancel
        </Link>
        <SubmitButton mode={mode} />
      </FormActions>
    </form>
  )
}
