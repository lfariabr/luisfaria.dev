import { Metadata } from 'next'

const siteUrl = 'https://luisfaria.dev'

export const defaultMetadata: Metadata = {
  title: 'Luis Faria | Software & Data Engineer',
  description: 'Software and data engineer in Sydney building secure education data products, applied ML systems, and production automation.',
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [{ url: '/icon', type: 'image/png' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },
  openGraph: {
    title: 'Luis Faria | Software & Data Engineer',
    description: 'Secure education data products, applied ML systems, and production automation.',
    url: siteUrl,
    siteName: 'Luis Faria',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luis Faria | Software & Data Engineer',
    description: 'Secure education data products, applied ML systems, and production automation.',
    creator: '@luisfariabr',
  },
}
