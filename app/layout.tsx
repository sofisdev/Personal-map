import type { Metadata } from 'next'
import ClientProviders from '@/components/ClientProviders'
import './globals.css'

export const metadata: Metadata = {
  title: 'Personal Map',
  description: 'An interactive 3D identity map',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#050510] text-white">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
