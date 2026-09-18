import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { BrandingProvider } from '@/lib/branding';

const inter = Inter({ subsets: ['latin'], variable: '--font-display' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dj-platform.onrender.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DJLink | Find DJs, Request Songs Live & Book Events',
    template: '%s | DJLink',
  },
  description:
    'DJLink is the marketplace for DJs in Rwanda. Discover DJs near you, send live song requests straight to the booth, book events, and tip via MTN Mobile Money. DJs can join and get paid.',
  applicationName: 'DJLink',
  keywords: [
    'DJ Rwanda',
    'DJs in Kigali',
    'live song requests',
    'request a song',
    'book a DJ',
    'DJ booking Rwanda',
    'MTN Mobile Money',
    'event DJ',
    'wedding DJ Kigali',
    'DJ marketplace',
  ],
  creator: 'DJLink',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'DJLink',
    url: '/',
    title: 'DJLink | Find DJs, Request Songs Live & Book Events',
    description:
      'Discover DJs in Rwanda, request songs in real time, and book your next event — all in one place.',
    locale: 'en_RW',
    images: [{ url: '/logo.png', width: 515, height: 268, alt: 'DJLink' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DJLink | Find DJs, Request Songs Live & Book Events',
    description: 'Discover DJs, request songs in real time, and book events — all in one place.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'entertainment',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#18181b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('dj_theme');var d=t==='light'?'light':'dark';var r=document.documentElement;if(d==='dark'){r.classList.add('dark')}r.style.colorScheme=d}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-display`}>
        <BrandingProvider>{children}</BrandingProvider>
      </body>
    </html>
  );
}