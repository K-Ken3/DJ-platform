import Link from 'next/link';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm sm:px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-auto" />
          <span className="text-zinc-400 dark:text-zinc-500">&middot; Kigali, Rwanda</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-4 text-zinc-500 dark:text-zinc-400">
          <Link href="/request/dj-vaxino" className="hover:text-zinc-900 dark:hover:text-white">
            Request a Song
          </Link>
          <a href="#about" className="hover:text-zinc-900 dark:hover:text-white">
            About
          </a>
          <a href="#events" className="hover:text-zinc-900 dark:hover:text-white">
            Events
          </a>
          <a href="#contact" className="hover:text-zinc-900 dark:hover:text-white">
            Book
          </a>
        </nav>

        <p className="text-xs text-zinc-400 dark:text-zinc-600">&copy; {new Date().getFullYear()} Designed AlverLabs. All rights reserved.</p>
      </div>
    </footer>
  );
}