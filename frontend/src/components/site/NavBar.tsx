'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';

const links = [
  { href: '#about', label: 'About' },
  { href: '#events', label: 'Events' },
  { href: '#blog', label: 'Blog' },
  { href: '#contact', label: 'Book' },
];

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="DJ Vaxino home" className="flex items-center">
          <Logo className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="rounded-xs px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/request/dj-vaxino" className="btn-primary hidden sm:inline-flex">
            Request a Song
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xs border border-zinc-200 bg-white text-zinc-600 md:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xs px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {link.label}
              </a>
            ))}
            <Link href="/request/dj-vaxino" className="btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
              Request a Song
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}