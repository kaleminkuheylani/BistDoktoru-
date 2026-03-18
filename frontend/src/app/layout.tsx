import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bist Doktoru - Türk Borsası Takip Platformu',
  description: 'BIST hisse senetleri takip, analiz ve eğitim platformu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
