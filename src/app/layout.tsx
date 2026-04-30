import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
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
  title: 'ConstructIQ — General Contractor OS',
  description: 'AI-powered document management, bid analysis, and subcontractor communication for General Contractors.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://constructiq.io'),
  openGraph: {
    title: 'ConstructIQ — General Contractor OS',
    description: 'Upload permits, AI extracts everything. Analyze bids, flag risks privately. Draft sub replies instantly.',
    type: 'website',
  },
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