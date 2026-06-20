import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import { MotionProvider } from '@/components/motion-provider'
import { JsonLd } from '@/components/json-ld'
import { organizationSchema, websiteSchema } from '@/lib/structured-data'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://jdtpromotions.com'),
  title: {
    default: 'JDT Promotions — Your brand’s creative powerhouse',
    template: '%s | JDT Promotions',
  },
  description:
    'JDT Promotions delivers world-class printing and design, talent management, and AI-powered development. One team for everything your brand needs.',
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  keywords: [
    'printing',
    'graphic design',
    'brand identity',
    'talent management',
    'AI development',
    'creative agency',
  ],
  openGraph: {
    type: 'website',
    siteName: 'JDT Promotions',
    title: 'JDT Promotions — Your brand’s creative powerhouse',
    description:
      'World-class printing and design, talent management, and AI-powered development. One partner, unlimited possibilities.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JDT Promotions — Your brand’s creative powerhouse',
    description:
      'World-class printing and design, talent management, and AI-powered development. One partner, unlimited possibilities.',
  },
}

export const viewport = {
  themeColor: '#1a1a1a',
  colorScheme: 'dark' as const,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`bg-background ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body className="font-sans antialiased">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <a
          href="#main"
          className="skip-link rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
