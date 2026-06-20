/**
 * Renders JSON-LD structured data into a `<script type="application/ld+json">`
 * tag. Server component — accepts a single schema object or an array of them.
 *
 * `JSON.stringify` inside `dangerouslySetInnerHTML` safely escapes the
 * first-party, static schema data for embedding in `<script>`.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
