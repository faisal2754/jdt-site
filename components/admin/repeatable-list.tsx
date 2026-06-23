'use client'

import { useId, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

/**
 * One editable column inside a repeatable row.
 *
 * `as` chooses the control. `key` is the property written into the row object
 * and, on submit, into the serialized JSON — so it must match the entity's
 * field name (e.g. `value`/`label` for stats, `href`/`handle` for socials).
 */
export interface RepeatableField {
  key: string
  label: string
  placeholder?: string
  as?: 'input' | 'textarea' | 'select'
  /** Optional sizing hint when several fields share a row. */
  grow?: number
  inputType?: string
  /** Options for `as: 'select'`. The first blank-value option acts as "unset". */
  options?: { value: string; label: string }[]
}

export type RepeatableRow = Record<string, string>

export interface RepeatableListProps {
  /** Hidden-input name the serialized JSON is written to (formData key). */
  name: string
  /** Visible section label. */
  legend: string
  /** Short helper line under the legend. */
  description?: string
  /** Column config for each row. A single field renders one control per row. */
  fields: RepeatableField[]
  /** Initial rows (edit mode). */
  defaultValue?: RepeatableRow[]
  /** Copy for the add button, e.g. "Add paragraph". */
  addLabel: string
  /** Per-row empty-state label, e.g. "No stats yet." */
  emptyLabel?: string
  /** Field-level error returned by the server action. */
  error?: string
}

let __rowSeq = 0
function nextRowId() {
  __rowSeq += 1
  return `r${__rowSeq}-${Math.random().toString(36).slice(2, 7)}`
}

interface InternalRow {
  _id: string
  data: RepeatableRow
}

function makeRow(fields: RepeatableField[], data?: RepeatableRow): InternalRow {
  const base: RepeatableRow = {}
  for (const f of fields) base[f.key] = data?.[f.key] ?? ''
  return { _id: nextRowId(), data: base }
}

/**
 * Generic add / remove / reorder rows field.
 *
 * Serialization: the whole `rows` array is JSON-stringified into ONE hidden
 * input (`name`). A Server Action reads `formData.get(name)` and `JSON.parse`s
 * it — a clean round-trip for `string[]` (single-field configs collapse to an
 * array of strings) and arrays of objects (stats / socials / service items).
 *
 * Motion follows the house style: rows blur-rise in, exit faster, drag handle +
 * up/down controls reorder, everything honours `prefers-reduced-motion`.
 */
export function RepeatableList({
  name,
  legend,
  description,
  fields,
  defaultValue,
  addLabel,
  emptyLabel = 'Nothing here yet.',
  error,
}: RepeatableListProps) {
  const reduce = useReducedMotion()
  const groupId = useId()
  const singleField = fields.length === 1
  const soleKey = fields[0]?.key

  const [rows, setRows] = useState<InternalRow[]>(() =>
    (defaultValue && defaultValue.length > 0
      ? defaultValue.map((d) => makeRow(fields, d))
      : []),
  )

  // Serialize for formData. Single-field lists collapse to string[]; otherwise
  // an array of row objects. Fully-empty rows are dropped so optional sections
  // don't post blank entries.
  const serialized = useMemo(() => {
    const cleaned = rows
      .map((r) => r.data)
      .filter((d) => Object.values(d).some((v) => v.trim().length > 0))
    if (singleField && soleKey) {
      return JSON.stringify(cleaned.map((d) => d[soleKey] ?? ''))
    }
    return JSON.stringify(cleaned)
  }, [rows, singleField, soleKey])

  function addRow() {
    setRows((prev) => [...prev, makeRow(fields)])
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r._id !== id))
  }

  function updateCell(id: string, key: string, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r._id === id ? { ...r, data: { ...r.data, [key]: value } } : r,
      ),
    )
  }

  function move(index: number, dir: -1 | 1) {
    setRows((prev) => {
      const target = index + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const enter = reduce
    ? { opacity: 1 }
    : { opacity: 0, y: 6, filter: 'blur(2px)' }
  const animateTo = { opacity: 1, y: 0, filter: 'blur(0px)' }
  const exit = reduce
    ? { opacity: 0 }
    : { opacity: 0, y: -4, filter: 'blur(2px)' }

  return (
    <fieldset
      className="flex flex-col gap-3"
      aria-describedby={error ? `${groupId}-error` : undefined}
    >
      <input type="hidden" name={name} value={serialized} readOnly />

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <legend className="text-sm font-medium text-foreground">
            {legend}
          </legend>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={addRow}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground shadow-card',
            'transition-[transform,background-color,box-shadow] duration-200 ease-smooth',
            'hover:bg-muted hover:shadow-elevated active:scale-[0.97]',
          )}
        >
          <Plus className="size-3.5" aria-hidden />
          {addLabel}
        </button>
      </div>

      <div
        className={cn(
          'flex flex-col gap-2 rounded-2xl border border-border bg-card/30 p-2',
          error && 'border-destructive/50',
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {rows.length === 0 ? (
            <motion.p
              key="__empty"
              initial={enter}
              animate={animateTo}
              exit={exit}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="px-3 py-5 text-center text-xs text-muted-foreground"
            >
              {emptyLabel}
            </motion.p>
          ) : (
            rows.map((row, index) => (
              <motion.div
                key={row._id}
                layout={!reduce}
                initial={enter}
                animate={animateTo}
                exit={exit}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="group/row flex items-start gap-2 rounded-xl border border-border/70 bg-background/60 p-2 shadow-card"
              >
                {/* Reorder controls */}
                <div className="flex flex-col items-center gap-0.5 pt-1.5">
                  <span
                    className="hidden text-muted-foreground/60 sm:block"
                    aria-hidden
                  >
                    <GripVertical className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${legend} row ${index + 1} up`}
                      className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronUp className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === rows.length - 1}
                      aria-label={`Move ${legend} row ${index + 1} down`}
                      className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronDown className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </div>

                {/* Field controls */}
                <div
                  className={cn(
                    'grid flex-1 gap-2',
                    fields.length > 1 && 'sm:grid-flow-col sm:auto-cols-fr',
                  )}
                >
                  {fields.map((field) => {
                    const cellId = `${groupId}-${row._id}-${field.key}`
                    const value = row.data[field.key] ?? ''
                    return (
                      <div key={field.key} className="flex flex-col gap-1">
                        {!singleField ? (
                          <Label
                            htmlFor={cellId}
                            className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground"
                          >
                            {field.label}
                          </Label>
                        ) : null}
                        {field.as === 'select' ? (
                          <select
                            id={cellId}
                            value={value}
                            onChange={(e) =>
                              updateCell(row._id, field.key, e.target.value)
                            }
                            aria-label={singleField ? field.label : undefined}
                            className="h-8 w-full min-w-0 rounded-lg border border-input bg-card/40 px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            {(field.options ?? []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field.as === 'textarea' ? (
                          <Textarea
                            id={cellId}
                            value={value}
                            onChange={(e) =>
                              updateCell(row._id, field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            rows={2}
                            aria-label={singleField ? field.label : undefined}
                            className="min-h-[2.5rem] bg-card/40"
                          />
                        ) : (
                          <Input
                            id={cellId}
                            type={field.inputType ?? 'text'}
                            value={value}
                            onChange={(e) =>
                              updateCell(row._id, field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            aria-label={singleField ? field.label : undefined}
                            className="bg-card/40"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeRow(row._id)}
                  aria-label={`Remove ${legend} row ${index + 1}`}
                  className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {error ? (
        <p
          id={`${groupId}-error`}
          role="alert"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
