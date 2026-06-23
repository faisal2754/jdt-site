'use client'

import { useActionState, useEffect, useId, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/admin/form-shell'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import type { Brand } from '@/lib/db/schema'

import {
  createBrandAction,
  updateBrandAction,
  type BrandFormState,
} from '../actions'

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
          {mode === 'create' ? 'Add brand' : 'Save changes'}
        </>
      )}
    </button>
  )
}

interface BrandFormBodyProps {
  brand?: Brand
  defaultSortOrder: number
  onCancel: () => void
  onSaved: () => void
}

/**
 * The form body. Mounted fresh per record (the parent keys it by id), so the
 * `useState` initializers seed the right values without a reset effect.
 */
function BrandFormBody({
  brand,
  defaultSortOrder,
  onCancel,
  onSaved,
}: BrandFormBodyProps) {
  const formId = useId()
  const mode = brand ? 'edit' : 'create'

  const action = brand
    ? updateBrandAction.bind(null, brand.id)
    : createBrandAction
  const [state, formAction] = useActionState<BrandFormState, FormData>(
    action,
    {},
  )

  const [name, setName] = useState(brand?.name ?? '')

  const fieldErrors = state.fieldErrors ?? {}

  // React to the action result: surface a failure, or close + refresh on success.
  useEffect(() => {
    if (state.formError) toast.error(state.formError)
    if (state.ok) {
      toast.success(mode === 'create' ? 'Brand added' : 'Changes saved')
      onSaved()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Field id={`${formId}-name`} label="Name" required error={fieldErrors.name}>
        <Input
          id={`${formId}-name`}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Co."
          aria-invalid={fieldErrors.name ? true : undefined}
          autoComplete="off"
          autoFocus
        />
      </Field>

      <ImageUploadField
        name="logoUrl"
        entity="brands"
        defaultValue={brand?.logoUrl ?? undefined}
        label="Logo"
        description="Optional. A transparent PNG or SVG works best."
        aspect="3 / 2"
        error={fieldErrors.logoUrl}
      />

      <Field
        id={`${formId}-sortOrder`}
        label="Sort order"
        hint="lower = earlier"
        error={fieldErrors.sortOrder}
        className="w-52"
      >
        <Input
          id={`${formId}-sortOrder`}
          name="sortOrder"
          type="number"
          min={0}
          step={1}
          defaultValue={brand?.sortOrder ?? defaultSortOrder}
          aria-invalid={fieldErrors.sortOrder ? true : undefined}
          className="h-9 tabular-nums"
        />
      </Field>

      <div className="-mx-4 -mb-4 flex items-center justify-end gap-3 rounded-b-xl border-t border-border bg-muted/40 px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-[0.98]"
        >
          Cancel
        </button>
        <SubmitButton mode={mode} />
      </div>
    </form>
  )
}

export interface BrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present in edit mode; omit for create. */
  brand?: Brand
  /** Default sort order for a freshly created brand (append to the list). */
  defaultSortOrder?: number
  /** Called after a successful save so the parent can refresh. */
  onSaved: () => void
}

/**
 * Inline create / edit dialog for a brand. Lightweight per the spec: just a
 * name (required), an optional logo upload, and a sort order. Reuses the shared
 * `Field` + `ImageUploadField` so it matches every other admin form.
 */
export function BrandDialog({
  open,
  onOpenChange,
  brand,
  defaultSortOrder = 0,
  onSaved,
}: BrandDialogProps) {
  const mode = brand ? 'edit' : 'create'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'New brand' : `Edit ${brand?.name}`}
          </DialogTitle>
          <DialogDescription>
            Brands appear in the homepage marquee. A logo is optional; the name
            renders when there isn’t one.
          </DialogDescription>
        </DialogHeader>

        {/* Key by record so the form remounts (and re-seeds) per brand / create. */}
        {open ? (
          <BrandFormBody
            key={brand?.id ?? 'create'}
            brand={brand}
            defaultSortOrder={defaultSortOrder}
            onCancel={() => onOpenChange(false)}
            onSaved={() => {
              onSaved()
              onOpenChange(false)
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
