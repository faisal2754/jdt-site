'use client'

import Image from 'next/image'
import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlus, Loader2, RefreshCw, Trash2, CircleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { StorageEntity } from '@/lib/storage/r2'
import { createUpload } from '@/app/admin/(dashboard)/_actions/upload'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB — matches what we accept into R2.

type Status = 'idle' | 'uploading' | 'error'

export interface ImageUploadFieldProps {
  /** Hidden-input name the stored publicUrl is written to (formData key). */
  name: string
  /** R2 key prefix; also gates which targets the upload action will sign. */
  entity: StorageEntity
  /** Existing image (edit mode) to preview. */
  defaultValue?: string
  label?: string
  description?: string
  /** Aspect of the preview frame. Public talent cards are 3/4. */
  aspect?: string
  error?: string
}

/**
 * Direct-to-R2 image upload.
 *
 * Flow:
 *   1. User picks a file. We call the `createUpload` Server Action, which
 *      (after `requireSession()`) returns a presigned PUT `uploadUrl` + the
 *      final `publicUrl`. No bytes touch the action.
 *   2. The browser PUTs the file straight to R2 via `XMLHttpRequest` so we get
 *      real upload progress, respecting Vercel's request-body limit.
 *   3. On success we write `publicUrl` into the hidden input the form submits.
 *
 * The hidden input is the single source of truth the Server Action validates.
 */
export function ImageUploadField({
  name,
  entity,
  defaultValue,
  label = 'Image',
  description,
  aspect = '3 / 4',
  error,
}: ImageUploadFieldProps) {
  const fieldId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const [url, setUrl] = useState(defaultValue ?? '')
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  function reset() {
    setStatus('idle')
    setProgress(0)
    setMessage(null)
  }

  async function handleFile(file: File) {
    reset()

    if (!file.type.startsWith('image/')) {
      setStatus('error')
      setMessage('Please choose an image file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setStatus('error')
      setMessage('Image must be 8 MB or smaller.')
      return
    }

    setStatus('uploading')

    const signed = await createUpload({
      entity,
      fileName: file.name,
      contentType: file.type,
    })
    if (!signed.ok) {
      setStatus('error')
      setMessage(signed.error)
      return
    }

    // PUT directly to R2 with progress.
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr
      xhr.open('PUT', signed.data.uploadUrl, true)
      xhr.setRequestHeader('Content-Type', file.type)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        xhrRef.current = null
        if (xhr.status >= 200 && xhr.status < 300) {
          setUrl(signed.data.publicUrl)
          setStatus('idle')
          setProgress(100)
        } else {
          setStatus('error')
          setMessage('Upload failed. Please try again.')
        }
        resolve()
      }
      xhr.onerror = () => {
        xhrRef.current = null
        setStatus('error')
        setMessage('Upload failed. Check your connection and retry.')
        resolve()
      }
      xhr.send(file)
    })
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    // Allow re-selecting the same file later.
    e.target.value = ''
  }

  function clearImage() {
    xhrRef.current?.abort()
    xhrRef.current = null
    setUrl('')
    reset()
  }

  const hasImage = url.length > 0
  const uploading = status === 'uploading'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {/* The value the form actually submits + validates against. */}
      <input type="hidden" name={name} value={url} readOnly />

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="sr-only"
        aria-invalid={error ? true : undefined}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* Preview / dropzone frame */}
        <div
          className={cn(
            'relative w-full max-w-[180px] overflow-hidden rounded-2xl border border-border bg-card/40 shadow-card',
            error && 'border-destructive/50',
          )}
          style={{ aspectRatio: aspect }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {hasImage ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={url}
                  alt="Selected preview"
                  fill
                  sizes="180px"
                  className="object-cover"
                  unoptimized
                />
              </motion.div>
            ) : (
              <motion.button
                key="empty"
                type="button"
                onClick={() => inputRef.current?.click()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 grid place-items-center gap-2 text-center text-muted-foreground transition-colors duration-200 hover:bg-muted/40 hover:text-foreground"
              >
                <span className="grid place-items-center gap-1.5">
                  <ImagePlus className="size-6" aria-hidden />
                  <span className="text-xs font-medium">Upload image</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Uploading overlay with progress. */}
          <AnimatePresence>
            {uploading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 z-10 grid place-items-center bg-background/75 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-5 animate-spin text-foreground" aria-hidden />
                  <span className="text-xs font-medium tabular-nums text-foreground">
                    {progress}%
                  </span>
                </div>
                <div className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-foreground"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3.5 py-2 text-xs font-medium text-foreground shadow-card',
              'transition-[transform,background-color,box-shadow] duration-200 ease-smooth',
              'hover:bg-muted hover:shadow-elevated active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {hasImage ? (
              <RefreshCw className="size-3.5" aria-hidden />
            ) : (
              <ImagePlus className="size-3.5" aria-hidden />
            )}
            {hasImage ? 'Replace' : 'Choose image'}
          </button>

          {hasImage ? (
            <button
              type="button"
              onClick={clearImage}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Remove
            </button>
          ) : null}

          <p className="max-w-[200px] text-[0.7rem] leading-relaxed text-muted-foreground">
            JPG, PNG, WebP or AVIF · up to 8 MB. Stored on the CDN.
          </p>
        </div>
      </div>

      {/* Upload-level error (network/type) — separate from the server field error. */}
      {status === 'error' && message ? (
        <p
          role="alert"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive"
        >
          <CircleAlert className="size-3.5" aria-hidden />
          {message}
        </p>
      ) : null}

      {/* Server-side validation error (e.g. "Image is required."). */}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
