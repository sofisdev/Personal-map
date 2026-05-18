import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Personal Map',
  description: 'An interactive 3D identity map',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="/api/og" />
      </head>
      <body className="bg-[#050510] text-white">{children}</body>
    </html>
  )
}
