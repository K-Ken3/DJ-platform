import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';

import { NavBar } from '@/components/site/NavBar';
import { SiteFooter } from '@/components/site/SiteFooter';
import { ContactForm } from '@/components/site/ContactForm';
import { BACKEND_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Dj = {
  name: string;
  slug: string;
  logo?: string | null;
  bio?: string | null;
  tagline?: string | null;
  location?: string | null;
  social_links?: string | null;
};

type EventItem = {
  id: number;
  name: string;
  venue?: string | null;
  event_date?: string | null;
  request_count?: number;
};

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image?: string | null;
  category?: string | null;
  published_at?: string | null;
};

const fallbackEvents: EventItem[] = [
  { id: 0, name: 'Sunset Rooftop Session', venue: 'Kigali', event_date: '2026-09-20', request_count: 0 },
  { id: 0, name: 'Private Wedding Night', venue: 'Rubavu', event_date: '2026-10-03', request_count: 0 },
  { id: 0, name: 'Club Residency', venue: 'Kigali City', event_date: '2026-09-26', request_count: 0 },
];

const fallbackPosts: Post[] = [
  { id: 0, title: 'How I Build a Night to Remember', slug: 'how-i-build-a-night-to-remember', category: 'Events', excerpt: 'Behind-the-scenes notes on preparing an unforgettable set.', published_at: null },
  { id: 0, title: 'Mixing for Diverse Crowds', slug: 'mixing-for-diverse-crowds', category: 'Tips', excerpt: 'Strategies for reading a room and balancing energy.', published_at: null },
];

async function getPublicData() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/dj/public`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch {
    // fall through to defaults when the API is unreachable
  }
  return { dj: null, events: fallbackEvents, posts: fallbackPosts };
}

function parseSocial(links?: string | null): { instagram?: string; audiomack?: string; facebook?: string; youtube?: string } {
  if (!links) return {};
  try {
    return JSON.parse(links);
  } catch {
    return {};
  }
}

function formatEventDate(date?: string | null): string {
  if (!date) return 'Date TBA';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function HomePage() {
  const data = await getPublicData();
  const dj: Dj | null = data.dj;
  const events: EventItem[] = (data.events?.length ? data.events : fallbackEvents) as EventItem[];
  const posts: Post[] = (data.posts?.length ? data.posts : fallbackPosts) as Post[];
  const social = parseSocial(dj?.social_links);

  const name = dj?.name || 'DJ Vaxino';
  const location = dj?.location || 'Kigali, Rwanda';
  const tagline = dj?.tagline || 'Soundtracking unforgettable nights.';
  const bio = dj?.bio || 'Blending Afrobeat, Amapiano, house, and late-night dance classics into immersive sets designed to keep the room moving from the first track to the final encore.';

  return (
    <main className="min-h-screen">
      <NavBar />

      {/* HERO */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-20 lg:gap-16">
          <div>
            <p className="eyebrow">DJ &middot; Music &middot; Nightlife &middot; Technology</p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Soundtracking
              <br />
              unforgettable nights.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
              {name} brings premium energy to clubs, weddings, lounges, and private events — with live song
              requests delivered straight to the booth in real time.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={`/request/${dj?.slug || 'dj-vaxino'}`} className="btn-primary btn-lg">
                Request a Song
              </Link>
              <a href="#contact" className="btn-outline btn-lg">
                Book the DJ
              </a>
            </div>

            <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
              {location} &middot; 8+ years on the decks &middot; WhatsApp requests live
            </p>
          </div>

          <div className="relative">
            <div className="relative flex items-center justify-center overflow-hidden border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt={`${name} brand mark`}
                width={515}
                height={268}
                className="mx-auto max-w-full px-10 py-12 dark:hidden sm:py-16"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-white.png"
                alt={`${name} brand mark`}
                width={515}
                height={268}
                className="mx-auto hidden max-w-full px-10 py-12 dark:block sm:py-16"
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-zinc-950/80 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 bg-emerald-400" />
                  Live now
                </span>
                <span>{location}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <Image
                src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80"
                alt={`${name} portrait`}
                width={800}
                height={1000}
                className="h-[380px] w-full object-cover"
              />
            </div>

            <div>
              <p className="eyebrow">About</p>
              <h2 className="section-title">Built for the dance floor.</h2>
              <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-300">{bio}</p>

              <dl className="mt-8 grid gap-px overflow-hidden border border-zinc-200 bg-zinc-200 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-800">
                {[
                  ['Style', 'Afro-fusion · House · Nightdrive'],
                  ['Experience', '8+ years performing live'],
                  ['Events', 'Weddings, clubs, lounges, private parties'],
                  ['Location', location],
                ].map(([term, detail]) => (
                  <div key={term} className="bg-zinc-50 p-5 dark:bg-zinc-950">
                    <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{term}</dt>
                    <dd className="mt-1.5 font-semibold">{detail}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap gap-2">
                {Object.entries(social)
                  .filter(([, url]) => url)
                  .map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noreferrer" className="btn-outline btn-sm capitalize">
                      {platform}
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="scroll-mt-20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mb-8">
            <p className="eyebrow">Portfolio</p>
            <h2 className="section-title">Recent events</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {events.slice(0, 3).map((event, index) => (
              <article key={`${event.name}-${index}`} className="card card-pad flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <span className="pill pill-played">Played</span>
                  <span className="text-xs text-zinc-400">{event.request_count ?? 0} requests</span>
                </div>
                <h3 className="text-xl font-bold leading-snug">{event.name}</h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{event.venue || 'Venue TBA'}</p>
                <div className="mt-auto pt-5">
                  <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatEventDate(event.event_date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {event.venue?.split(',')[0] || 'Kigali'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="scroll-mt-20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Blog</p>
              <h2 className="section-title">Notes from the booth</h2>
            </div>
            <Link href="/request/dj-vaxino" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              Request a song now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {posts.slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="card card-pad group flex flex-col">
                <span className="mb-4 inline-flex w-fit rounded-xs border border-zinc-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {post.category || 'Notes'}
                </span>
                <h3 className="text-lg font-bold leading-snug group-hover:underline">{post.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">{post.excerpt}</p>
                <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Read post <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* REQUEST STRIP */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-16">
          <div>
            <p className="eyebrow">Live request system</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Got a song you need to hear?</h2>
            <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-300">
              Scan a QR code at the venue, type the song, and it lands on the DJ&apos;s screen in seconds —
              no app, no account, no friction.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <Link href="/request/dj-vaxino" className="btn-primary btn-lg">
              Request a Song
            </Link>
            <a href="#contact" className="btn-outline btn-lg">
              Book the DJ
            </a>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow">Booking</p>
              <h2 className="section-title">Book the DJ</h2>
              <p className="mt-5 max-w-lg text-zinc-600 dark:text-zinc-300">
                For private events, club sets, weddings, and branded experiences, let&apos;s build a night
                that feels tailored from the first beat to the last call.
              </p>
              <dl className="mt-8 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Phone / Booking</dt>
                  <dd className="mt-1 font-semibold">+250 789 630 452</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Based in</dt>
                  <dd className="mt-1 font-semibold">{location}</dd>
                </div>
              </dl>
            </div>

            <div className="surface-2 p-5 sm:p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}