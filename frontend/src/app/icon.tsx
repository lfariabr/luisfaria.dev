import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          fontSize: 21,
          fontWeight: 800,
          fontFamily:
            'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          letterSpacing: '-0.04em',
          borderRadius: 8,
        }}
      >
    <span
      style={{
          color: '#22c55e',
    }}>
      LF
    </span>

      </div>
    ),
    size
  )
}
