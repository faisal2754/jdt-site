import { ImageResponse } from 'next/og'

export const alt = 'JDT Promotions — One partner, unlimited possibilities.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
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
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: '#f5f5f5',
          }}
        >
          JDT Promotions
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
            flexWrap: 'wrap',
            fontSize: 48,
            color: '#c8c8c8',
            letterSpacing: '-0.01em',
          }}
        >
          <span>One partner,&nbsp;</span>
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            unlimited
          </span>
          <span>&nbsp;possibilities.</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
