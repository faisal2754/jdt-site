import { ImageResponse } from 'next/og'
import { getCreatorBySlug } from '@/lib/creators'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const creator = getCreatorBySlug(slug)
  const alt = creator
    ? `${creator.name} — ${creator.category} | JDT Promotions`
    : 'JDT Promotions creator'
  return [{ id: 'og', alt, size, contentType }]
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const creator = getCreatorBySlug(slug)

  const title = creator ? creator.name : 'JDT Promotions'
  const subtitle = creator ? creator.category : 'Creators & Talent'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          padding: '96px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#8a8a8a',
          }}
        >
          JDT Promotions
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: '#f5f5f5',
            marginTop: 28,
          }}
        >
          {title}
        </div>

        <div
          style={{
            width: 160,
            height: 1,
            backgroundColor: '#8a8a8a',
            margin: '40px 0',
          }}
        />

        <div
          style={{
            display: 'flex',
            fontSize: 48,
            color: '#c8c8c8',
            letterSpacing: '-0.01em',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
