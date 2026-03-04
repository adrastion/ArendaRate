import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

const siteUrl = 'https://arendarate.ru'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'АрендаРейт — Отзывы об аренде жилья',
    template: '%s | АрендаРейт',
  },
  description:
    'Честная аренда начинается здесь. Читай отзывы арендаторов, смотри оценки по адресам на карте. Платформа отзывов об аренде жилья с интерактивной картой.',
  keywords: [
    'отзывы об аренде',
    'аренда жилья',
    'отзывы о квартирах',
    'аренда квартир',
    'отзывы арендаторов',
    'карта отзывов',
    'снять квартиру',
    'АрендаРейт',
  ],
  authors: [{ name: 'АрендаРейт', url: siteUrl }],
  creator: 'АрендаРейт',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    siteName: 'АрендаРейт',
    title: 'АрендаРейт — Отзывы об аренде жилья',
    description:
      'Честная аренда начинается здесь. Читай отзывы арендаторов, смотри оценки по адресам на карте.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'АрендаРейт — Отзывы об аренде жилья',
    description: 'Платформа отзывов об аренде жилья с интерактивной картой.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: { url: `${siteUrl}/favicon.png`, type: 'image/png' },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

