import type { Metadata } from 'next'
import './globals.css'
import { AdminProvider } from './contexts/AdminContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'

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
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <LanguageProvider>
            <AdminProvider>
              {children}
            </AdminProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
