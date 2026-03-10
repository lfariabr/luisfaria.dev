import { Metadata } from 'next'

const siteUrl = 'https://luisfaria.dev'

export const defaultMetadata: Metadata = {
  title: 'Luis Faria | Senior Software Engineer',
  description: 'Expertise in modern web technologies, system architecture, and team leadership. Check out my portfolio and projects.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Luis Faria | Senior Software Engineer',
    description: 'Expertise in modern web technologies, system architecture, and team leadership.',
    url: siteUrl,
    siteName: 'Luis Faria',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luis Faria | Senior Software Engineer',
    description: 'Expertise in modern web technologies, system architecture, and team leadership.',
    creator: '@luisfariabr',
  },
}
