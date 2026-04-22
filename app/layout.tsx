import type { Metadata } from 'next'
import './globals.css'
import { AdminProvider } from './contexts/AdminContext'
import { LanguageProvider } from './contexts/LanguageContext'

export const metadata: Metadata = {
  title: 'WaterApp Dashboard',
  description: 'Water Footprint Admin Dashboard',
}

// Tek tema (light). Eski localStorage tercihi varsa temizle, `dark` class'ı asla uygulanmasın.
const themeInitScript = `(function(){try{var d=document.documentElement;d.classList.remove('dark');d.style.colorScheme='light';localStorage.removeItem('theme');}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <LanguageProvider>
          <AdminProvider>
            {children}
          </AdminProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
