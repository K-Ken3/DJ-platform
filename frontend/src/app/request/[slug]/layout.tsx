import type { Metadata } from 'next';
import { BACKEND_URL } from '@/lib/api';

type Dj = {
  name: string;
  slug: string;
  logo?: string | null;
  tagline?: string | null;
};

async function getDj(slug: string): Promise<Dj | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/dj/public/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { dj?: Dj | null };
      return data.dj || null;
    }
  } catch {
    // fall through
  }
  return null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const dj = await getDj(params.slug);
  if (!dj) {
    return {
      title: 'Request a Song',
      robots: { index: false },
    };
  }
  const ogImage =
    dj.logo && !dj.logo.startsWith('data:') && !dj.logo.startsWith('/vaxino-logo.png')
      ? [{ url: dj.logo, alt: `${dj.name} logo` }]
      : [];
  return {
    title: `Request a song with ${dj.name}`,
    description: dj.tagline || `Send live song requests and tips to ${dj.name} — powered by DJLink.`,
    alternates: { canonical: `/request/${dj.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      url: `/request/${dj.slug}`,
      title: `Request a song — ${dj.name}`,
      description: dj.tagline || `Send live song requests and tips to ${dj.name} — powered by DJLink.`,
      images: ogImage,
    },
    twitter: {
      card: 'summary',
      title: `Request a song — ${dj.name}`,
      description: dj.tagline || `Send live song requests and tips to ${dj.name} — powered by DJLink.`,
    },
  };
}

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}