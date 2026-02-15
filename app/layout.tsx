import type { Metadata } from 'next'
import './globals.css'
import { AdminProvider } from './contexts/AdminContext'
import { LanguageProvider } from './contexts/LanguageContext'

export const metadata: Metadata = {
  title: 'WaterApp Dashboard',
  description: 'Water Footprint Admin Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <LanguageProvider>
          <AdminProvider>
            {children}
          </AdminProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
