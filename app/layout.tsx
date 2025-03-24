import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Water App Dashboard',
  description: 'Admin dashboard for Water App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <main className="min-h-screen bg-[#f0f7ff] bg-opacity-50 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="container mx-auto py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
