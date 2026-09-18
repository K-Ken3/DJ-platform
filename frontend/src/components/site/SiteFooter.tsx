'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { useBranding } from '@/lib/branding';

export function SiteFooter() {
  const { branding } = useBranding();
  const siteName = branding.site_name || 'DJLink';

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm sm:px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <Logo
            className="h-7 w-auto"
            lightSrc={branding.footer_logo || '/logo.png'}
            darkSrc={branding.footer_logo_dark || '/logo-white.png'}
          />
          <span className="text-zinc-400 dark:text-zinc-500">&middot; Kigali, Rwanda</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-4 text-zinc-500 dark:text-zinc-400">
          <a href="#djs" className="hover:text-zinc-900 dark:hover:text-white">
            Find a DJ
          </a>
          <a href="#how" className="hover:text-zinc-900 dark:hover:text-white">
            How it works
          </a>
          <Link href="/admin/register" className="hover:text-zinc-900 dark:hover:text-white">
            Join as a DJ
          </Link>
          <Link href="/admin/login" className="hover:text-zinc-900 dark:hover:text-white">
            DJ Login
          </Link>
        </nav>

        <p className="text-xs text-zinc-400 dark:text-zinc-600">&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
      </div>
    </footer>
  );
}