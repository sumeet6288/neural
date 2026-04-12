import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import dynamic from 'next/dynamic'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
})

// Lazy load heavy components
const DAONav = dynamic(() => import('@/components/DAONav'), {
  ssr: false,
  loading: () => <div className="h-16 glass-aip border-b border-white/5" />
})

export const metadata: Metadata = {
  title: 'NeuraFinance - AI-Driven DeFi Platform',
  description: 'Next-generation DeFi platform powered by AI simulation engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DAONav />
        <main className="pt-16">
          {children}
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
