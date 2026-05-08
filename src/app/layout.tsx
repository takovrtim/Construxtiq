import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ConstructIQ — Built for Contractors',
  description: 'The operating system for electrical and plumbing contractors. Permits, crew, change orders, and invoices — all in one place.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://constructiq.app'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ConstructIQ',
  },
  openGraph: {
    title: 'ConstructIQ — Built for Contractors',
    description: 'Permits, crew, change orders, and invoices — all in one place. Built for electrical and plumbing contractors.',
    type: 'website',
    siteName: 'ConstructIQ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ConstructIQ — Built for Contractors',
    description: 'The operating system for electrical and plumbing contractors.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#d95f2b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}