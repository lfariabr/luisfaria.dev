import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          fontSize: 88,
          fontWeight: 800,
          fontFamily:
            'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          letterSpacing: '-0.04em',
        }}
      >
        <span
          style={{
            backgroundImage: 'linear-gradient(90deg, #34d399 0%, #059669 100%)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          LF
        </span>
      </div>
    ),
    size
  )
}
