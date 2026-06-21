'use client'

import { useActionState, useId, useState } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Check, Link2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { ImageUploadField } from './image-upload-field'
import { RepeatableList } from './repeatable-list'
import { Field, FormActions, FormSection } from './form-shell'
import type { ServiceFormState } from '@/app/admin/(dashboard)/services/actions'

/** Slugify a label the same shape the validator enforces: `Talent Management` → `talent-management`. */
function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface ServiceFormValues {
  label?: string
  slug?: string
  tagline?: string
  description?: string
  imageUrl?: string
  services?: { name: string; description: string }[]
  sortOrder?: number
}

export interface ServiceFormProps {
  /** Bound Server Action (create, or update.bind(null, id)). */
  action: (
    state: ServiceFormState,
    formData: FormData,
  ) => Promise<ServiceFormState>
  /** Existing values in edit mode. */
  defaultValues?: ServiceFormValues
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
          {mode === 'create' ? 'Create service' : 'Save changes'}
        </>
      )}
    </button>
  )
}

export function ServiceForm({ action, defaultValues, mode }: ServiceFormProps) {
  const formId = useId()
  const [state, formAction] = useActionState<ServiceFormState, FormData>(
    action,
    {},
  )

  // Slug auto-generates from the label until the admin edits it by hand.
  const [label, setLabel] = useState(defaultValues?.label ?? '')
  const [slug, setSlug] = useState(defaultValues?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug))

  const fieldErrors = state.fieldErrors ?? {}

  // Form-level error → toast (e.g. duplicate slug surfaced at form scope).
  if (state.formError) {
    toast.error(state.formError)
  }

  function onLabelChange(value: string) {
    setLabel(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {/* Identity */}
      <FormSection
        title="Identity"
        description="Label, URL slug, and the tagline shown on the service page."
        index={0}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id={`${formId}-label`}
            label="Label"
            required
            error={fieldErrors.label}
          >
            <Input
              id={`${formId}-label`}
              name="label"
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="Talent Management"
              aria-invalid={fieldErrors.label ? true : undefined}
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
                placeholder="talent-management"
                aria-invalid={fieldErrors.slug ? true : undefined}
                className="pl-8"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </Field>
        </div>

        <Field
          id={`${formId}-tagline`}
          label="Tagline"
          required
          error={fieldErrors.tagline}
        >
          <Input
            id={`${formId}-tagline`}
            name="tagline"
            defaultValue={defaultValues?.tagline ?? ''}
            placeholder="A short, punchy line for the service hero."
            aria-invalid={fieldErrors.tagline ? true : undefined}
            autoComplete="off"
          />
        </Field>

        <Field
          id={`${formId}-description`}
          label="Description"
          required
          error={fieldErrors.description}
        >
          <Textarea
            id={`${formId}-description`}
            name="description"
            defaultValue={defaultValues?.description ?? ''}
            placeholder="A paragraph describing this service category…"
            rows={4}
            aria-invalid={fieldErrors.description ? true : undefined}
          />
        </Field>
      </FormSection>

      {/* Image */}
      <FormSection
        title="Image"
        description="Shown on the service category page (4:3 landscape)."
        index={1}
      >
        <ImageUploadField
          name="imageUrl"
          entity="services"
          defaultValue={defaultValues?.imageUrl}
          label="Service image"
          description="A landscape crop renders best."
          aspect="4 / 3"
          error={fieldErrors.imageUrl}
        />
      </FormSection>

      {/* Service items */}
      <FormSection
        title="Services"
        description="The individual offerings listed under this category, in display order."
        index={2}
      >
        <RepeatableList
          name="services"
          legend="Service items"
          description="Each has a name and a short description."
          fields={[
            { key: 'name', label: 'Name', placeholder: 'Brand strategy' },
            {
              key: 'description',
              label: 'Description',
              as: 'textarea',
              placeholder: 'A short description of this offering…',
            },
          ]}
          defaultValue={defaultValues?.services}
          addLabel="Add service"
          emptyLabel="No service items yet."
          error={fieldErrors.services}
        />
      </FormSection>

      {/* Ordering */}
      <FormSection
        title="Ordering"
        description="Where this category sits in the services list."
        index={3}
      >
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
      </FormSection>

      <FormActions>
        <Link
          href="/admin/services"
          className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-[0.98]"
        >
          Cancel
        </Link>
        <SubmitButton mode={mode} />
      </FormActions>
    </form>
  )
}
