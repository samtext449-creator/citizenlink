import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CitizenLink - KRA PIN Services',
  description: 'Get your KRA PIN quickly and easily',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}
