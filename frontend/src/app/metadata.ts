import { Metadata } from 'next'

const siteUrl = 'https://luisfaria.dev'

export const defaultMetadata: Metadata = {
  title: 'Luis Faria | Senior Software Engineer',
  description: 'Senior software engineer in Sydney: a parent portal used by 2,000 families, the data systems behind a school, and applied ML, shipped with agentic tooling.',
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [{ url: '/icon', type: 'image/png' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },
  openGraph: {
    title: 'Luis Faria | Senior Software Engineer',
    description: 'Ten years of shipping software that real people depend on.',
    url: siteUrl,
    siteName: 'Luis Faria',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luis Faria | Senior Software Engineer',
    description: 'Ten years of shipping software that real people depend on.',
    creator: '@luisfariabr',
  },
}
