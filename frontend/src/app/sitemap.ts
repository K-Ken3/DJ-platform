import type { MetadataRoute } from 'next';
import { BACKEND_URL } from '@/lib/api';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://dj-platform.onrender.com';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const res = await fetch(`${BACKEND_URL}/api/blog`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { posts?: { slug: string; published_at?: string | null }[] };
      for (const post of data.posts || []) {
        entries.push({
          url: `${base}/blog/${post.slug}`,
          lastModified: post.published_at ? new Date(post.published_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch {
    // keep existing entries if the API is unreachable
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/djs/public`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { djs?: { slug: string; created_at?: string | null }[] };
      for (const dj of data.djs || []) {
        entries.push({
          url: `${base}/dj/${dj.slug}`,
          lastModified: dj.created_at ? new Date(dj.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
        entries.push({
          url: `${base}/request/${dj.slug}`,
          lastModified: dj.created_at ? new Date(dj.created_at) : new Date(),
          changeFrequency: 'daily',
          priority: 0.6,
        });
      }
    }
  } catch {
    // keep existing entries if the API is unreachable
  }

  return entries;
}