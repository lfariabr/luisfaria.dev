'use client'

import Script from 'next/script'

// The inline gtag snippet needs the request's nonce (#479); the external script is
// trusted through 'strict-dynamic' but takes it too.
const GoogleAnalytics = ({ nonce }: { nonce?: string }) => {
  return (
    <>
      <Script
        nonce={nonce}
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=G-RZW38XNT3N`}
      />
      <Script
        id="google-analytics"
        nonce={nonce}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RZW38XNT3N');
          `,
        }}
      />
    </>
  )
}

export default GoogleAnalytics