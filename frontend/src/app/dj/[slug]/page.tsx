import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, FileText, Mail, MapPin, Music2 } from 'lucide-react';

import { NavBar } from '@/components/site/NavBar';
import { SiteFooter } from '@/components/site/SiteFooter';
import { ContactForm } from '@/components/site/ContactForm';
import { Logo } from '@/components/site/Logo';
import { BACKEND_URL } from '@/lib/api';
import type { BlogPost, DjProfile, DjPublicPage, PublicDjEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dj-platform.onrender.com';

async function getDjPage(slug: string): Promise<DjPublicPage | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/dj/public/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as DjPublicPage;
  } catch {
    return null;
  }
}

function safeSocialLinks(links: DjProfile['social_links']) {
  if (!links) return [];
  try {
    const parsed = typeof links === 'string' ? JSON.parse(links) : links;
    return Object.entries(parsed as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && Boolean(entry[1])
    );
  } catch {
    return [];
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isBrandLogo(logo?: string | null) {
  return logo === '/logo.png' || logo === '/logo-white.png';
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getDjPage(params.slug);
  if (!data) {
    return { title: 'DJ Profile', robots: { index: false } };
  }
  const dj = data.dj;
  const description = dj.bio || dj.tagline || `Book ${dj.name} and send live song requests — powered by DJLink.`;
  const ogImage = dj.logo && !dj.logo.startsWith('data:') ? [{ url: dj.logo, alt: `${dj.name} logo` }] : [];
  return {
    title: `${dj.name} — DJ Profile`,
    description,
    alternates: { canonical: `/dj/${dj.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'profile',
      url: `/dj/${dj.slug}`,
      title: `${dj.name} on DJLink`,
      description,
      images: ogImage,
    },
    twitter: {
      card: 'summary',
      title: `${dj.name} on DJLink`,
      description,
    },
  };
}

export default async function DjProfilePage({ params }: { params: { slug: string } }) {
  const data = await getDjPage(params.slug);
  const base = siteUrl;

  return (
    <main className="min-h-screen">
      <NavBar />

      {!data ? (
        <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <span className="flex h-14 w-14 items-center justify-center bg-accent/10 text-accent">
            <Music2 className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">DJ not found</h1>
          <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            This DJ does not exist or has not been approved yet. Check the link and try again.
          </p>
          <Link href="/" className="btn-primary mt-6">
            Browse DJs
          </Link>
        </section>
      ) : (
        <ProfileContent data={data} base={base} />
      )}

      <SiteFooter />
    </main>
  );
}

function ProfileContent({ data, base }: { data: DjPublicPage; base: string }) {
  const { dj, events, posts } = data;
  const social = safeSocialLinks(dj.social_links);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      {/* HERO */}
      <section className="card overflow-hidden">
        <div className="flex h-24 items-center justify-center bg-zinc-50 dark:bg-zinc-950/60 sm:h-32">
          {isBrandLogo(dj.logo) ? (
            <Logo className="h-10 w-auto sm:h-14" />
          ) : dj.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dj.logo} alt={`${dj.name} logo`} className="max-h-24 max-w-full object-contain sm:max-h-32" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center bg-accent/10 text-2xl font-extrabold text-accent sm:h-20 sm:w-20 sm:text-3xl">
              {dj.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'DJ'}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5 p-5 sm:p-8 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{dj.name}</h1>
              <span className="pill pill-played w-fit">Verified</span>
            </div>
            {dj.tagline && <p className="mt-1.5 text-zinc-600 dark:text-zinc-300">{dj.tagline}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              {dj.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {dj.location}
                </span>
              )}
              {social.length > 0 && (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  {social.map(([label, value]) => (
                    <a
                      key={label}
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {label}
                    </a>
                  ))}
                </span>
              )}
            </div>
          </div>

          <a href="#contact-dj" className="btn-primary btn-lg shrink-0">
            Contact {dj.name}
          </a>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
        <div className="space-y-8">
          {dj.bio && (
            <section>
              <h2 className="section-title">About</h2>
              <p className="mt-3 whitespace-pre-line text-zinc-600 dark:text-zinc-300">{dj.bio}</p>
            </section>
          )}

          <section>
            <h2 className="section-title">Upcoming events</h2>
            {events.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                No live events scheduled right now — check back soon.
              </p>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {events.map((event) => (
                  <li key={event.id} className="card card-pad flex flex-col">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-xs border border-emerald-700/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live event
                    </span>
                    <p className="mt-3 font-extrabold">{event.name}</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {[event.venue, formatDate(event.event_date)].filter(Boolean).join(' · ')}
                    </p>
                    <Link
                      href={`/request/${dj.slug}?event=${event.event_code}`}
                      className="btn-outline btn-sm mt-4 inline-flex items-center justify-center gap-1.5"
                    >
                      <Music2 className="h-3.5 w-3.5" />
                      Request a song
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {posts.length > 0 && (
            <section>
              <h2 className="section-title">From the blog</h2>
              <ul className="mt-4 space-y-3">
                {posts.map((post: BlogPost) => (
                  <li key={post.id}>
                    <Link href={`/blog/${post.slug}`} className="card card-pad flex items-start gap-3 hover:border-accent">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>
                        <span className="block font-bold">{post.title}</span>
                        {post.excerpt && (
                          <span className="mt-0.5 line-clamp-1 block text-sm text-zinc-500 dark:text-zinc-400">{post.excerpt}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* CONTACT THIS DJ */}
        <aside id="contact-dj" className="scroll-mt-20">
          <div className="surface-2 p-5 sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center bg-accent/10 text-accent">
                <Mail className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-extrabold">Book {dj.name}</h2>
            </div>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Tell {dj.name} about your event. Your message goes straight to their dashboard.
            </p>
            <div className="mt-5">
              <ContactForm djId={dj.id} />
            </div>
          </div>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: dj.name,
            url: `${base}/dj/${dj.slug}`,
            jobTitle: 'Disc Jockey',
            image: dj.logo && !dj.logo.startsWith('data:') ? dj.logo : `${base}/logo.png`,
            address: dj.location ? { '@type': 'PostalAddress', addressLocality: dj.location } : undefined,
            ...(events.length > 0
              ? {
                  event: events.map((event: PublicDjEvent) => ({
                    '@type': 'Event',
                    name: event.name,
                    startDate: event.event_date || undefined,
                    location: event.venue ? { '@type': 'Place', name: event.venue } : undefined,
                  })),
                }
              : {}),
          }),
        }}
      />
    </div>
  );
}