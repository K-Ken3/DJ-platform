import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'DJ Vaxino | Live Song Requests & Booking',
  description:
    'Premium DJ portfolio, real-time song request platform, event booking, and MTN Mobile Money tipping for clubs, weddings, and parties.',
  openGraph: {
    title: 'DJ Vaxino | Live Song Requests & Booking',
    description: 'Request a song in real time, book the DJ, and tip via MTN Mobile Money.',
    type: 'website',
    images: [{ url: '/logo.png', width: 515, height: 268, alt: 'DJ Vaxino' }],
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