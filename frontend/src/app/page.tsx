import Link from 'next/link';
import { CalendarDays, Music2, QrCode, Radio, Smartphone, UserCheck } from 'lucide-react';

import { NavBar } from '@/components/site/NavBar';
import { SiteFooter } from '@/components/site/SiteFooter';
import { ContactForm } from '@/components/site/ContactForm';
import { DjDirectory } from '@/components/site/DjDirectory';
import { BACKEND_URL } from '@/lib/api';
import type { PublicDj, RegistrationInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

const fallbackInfo: RegistrationInfo = {
  subscription_fee: 22000,
  subscription_fee_usd: 15,
  usd_rwf_rate: 1469,
  currency: 'RWF',
  mtn_momo_number: '0789630452',
  mtn_momo_ussd: '*182*8*1*1540166*22000#',
  momo_account_name: 'Ken',
};

async function getDjs(): Promise<PublicDj[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/djs/public`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { djs?: PublicDj[] };
      return data.djs || [];
    }
  } catch {
    // API unreachable — show the empty state instead of crashing
  }
  return [];
}

async function getRegistrationInfo(): Promise<RegistrationInfo> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/registration-info`, { cache: 'no-store' });
    if (res.ok) return (await res.json()) as RegistrationInfo;
  } catch {
    // fall through to defaults
  }
  return fallbackInfo;
}

const steps = [
  {
    icon: UserCheck,
    title: 'Find your DJ',
    body: 'Browse verified DJs on DJLink. Every profile is approved before it goes live.',
  },
  {
    icon: QrCode,
    title: 'Scan or open a request page',
    body: 'At the venue, scan the DJ’s QR code or open their request page. No app, no account.',
  },
  {
    icon: Radio,
    title: 'It lands on the booth',
    body: 'Your request appears live on the DJ’s screen in seconds — read, queued, and played.',
  },
];

const djFeatures = [
  'Your own public DJ page and request URL',
  'Unlimited events with QR codes',
  'Live song request queue with sound alerts',
  'Accept tips via MTN Mobile Money',
  'Blog and profile you control',
  'Discoverable in the DJLink directory',
];

export default async function HomePage() {
  const [djs, info] = await Promise.all([getDjs(), getRegistrationInfo()]);

  return (
    <main className="min-h-screen">
      <NavBar />

      {/* HERO */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-20 lg:gap-16">
          <div>
            <p className="eyebrow">DJs &middot; Live requests &middot; Bookings</p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Every event needs
              <br />
              the right DJ.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
              DJLink connects party people with the DJs who move the room. Discover DJs, send live song
              requests straight to the booth, and book your next event — all in one place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#djs" className="btn-primary btn-lg">
                Browse DJs
              </a>
              <Link href="/admin/register" className="btn-outline btn-lg">
                Join as a DJ
              </Link>
            </div>

            <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
              {djs.length > 0 ? `${djs.length} ${djs.length === 1 ? 'DJ' : 'DJs'} live` : 'Be the first DJ'} &middot; Real-time song
              requests &middot; MTN Mobile Money
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Music2, title: 'Live requests', body: 'Songs reach the booth in seconds.' },
              { icon: CalendarDays, title: 'Bookings', body: 'Find DJs for clubs, weddings, and parties.' },
              { icon: Smartphone, title: 'Mobile money', body: 'Tip and pay with MTN MoMo.' },
              { icon: UserCheck, title: 'Verified DJs', body: 'Every profile is approved by DJLink.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="card card-pad">
                  <span className="flex h-10 w-10 items-center justify-center bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 font-bold">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DJ DIRECTORY */}
      <section id="djs" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mb-8">
            <p className="eyebrow">Directory</p>
            <h2 className="section-title">Find a DJ</h2>
            <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-300">
              Open a DJ&apos;s request page, scan their QR code at an event, or book them for your next party.
            </p>
          </div>

          <DjDirectory djs={djs} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="scroll-mt-20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mb-8">
            <p className="eyebrow">How it works</p>
            <h2 className="section-title">From the crowd to the decks.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="card card-pad">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center bg-accent/10 text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOR DJS / PRICING */}
      <section id="pricing" className="scroll-mt-20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="eyebrow">For DJs</p>
            <h2 className="section-title">Grow your bookings on DJLink.</h2>
            <p className="mt-5 max-w-xl text-zinc-600 dark:text-zinc-300">
              Get a verified profile in the directory, your own request page, unlimited events with QR codes, a
              live request queue, tip collection, and a blog — everything you need to run the night.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {djFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-200">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="card card-pad flex flex-col">
            <span className="pill pill-played w-fit">Membership</span>
            <p className="mt-5 text-4xl font-extrabold tracking-tight">
              ${info.subscription_fee_usd || 15} <span className="text-lg font-bold text-zinc-400">USD</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              ≈ {info.subscription_fee.toLocaleString()} {info.currency} to pay
            </p>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              One-time activation fee. Pay via MTN Mobile Money and our team verifies your account.
            </p>

            <dl className="mt-6 space-y-3 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Membership fee</dt>
                <dd className="font-semibold">${info.subscription_fee_usd || 15} ({(info.subscription_fee || 22000).toLocaleString()} {info.currency})</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Exchange rate</dt>
                <dd className="font-semibold">1 USD ≈ {(info.usd_rwf_rate || 1469).toLocaleString()} {info.currency}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Account name</dt>
                <dd className="font-semibold">{info.momo_account_name || 'Ken'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">MoMo number</dt>
                <dd className="font-mono font-semibold">{info.mtn_momo_number}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">USSD</dt>
                <dd className="font-mono font-semibold">{info.mtn_momo_ussd}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Approval</dt>
                <dd className="font-semibold">Within 24 hours</dd>
              </div>
            </dl>

            <Link href="/admin/register" className="btn-primary btn-lg mt-8">
              Join as a DJ
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow">Booking & support</p>
              <h2 className="section-title">Let&apos;s talk events.</h2>
              <p className="mt-5 max-w-lg text-zinc-600 dark:text-zinc-300">
                Booking a DJ, joining DJLink, or need help with your account? Send us a message and the DJLink
                team will get back to you.
              </p>
              <dl className="mt-8 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Based in</dt>
                  <dd className="mt-1 font-semibold">Kigali, Rwanda</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Support</dt>
                  <dd className="mt-1 font-semibold">Available 7 days a week</dd>
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