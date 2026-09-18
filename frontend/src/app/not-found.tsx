import Link from 'next/link';
import { Compass } from 'lucide-react';

import { NavBar } from '@/components/site/NavBar';
import { SiteFooter } from '@/components/site/SiteFooter';

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <NavBar />
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center bg-accent/10 text-accent">
          <Compass className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">404</h1>
        <p className="mt-3 max-w-md text-zinc-500 dark:text-zinc-400">
          This page could not be found. It may have been moved, or the link is broken.
        </p>
        <Link href="/" className="btn-primary btn-lg mt-8">
          Back to DJLink
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}