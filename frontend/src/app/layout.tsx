import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dj-platform.onrender.com'),
  title: 'DJLink | Find DJs, Request Songs Live & Book Events',
  description:
    'DJLink is the marketplace for DJs. Discover DJs near you, send live song requests straight to the booth, book events, and tip via MTN Mobile Money. DJs can join and get paid.',
  openGraph: {
    title: 'DJLink | Find DJs, Request Songs Live & Book Events',
    description: 'Discover DJs, request songs in real time, and book events — all in one place.',
    type: 'website',
    images: [{ url: '/logo.png', width: 515, height: 268, alt: 'DJLink' }],
  },
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
      <body className={`${inter.variable} font-display`}>{children}</body>
    </html>
  );
}