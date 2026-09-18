'use client';

import { useBranding } from '@/lib/branding';

export function Logo({
  className = 'h-8 w-auto',
  lightSrc,
  darkSrc,
}: {
  className?: string;
  lightSrc?: string;
  darkSrc?: string;
}) {
  const { branding } = useBranding();
  const light = lightSrc || branding.site_logo || '/logo.png';
  const dark = darkSrc || branding.site_logo_dark || '/logo-white.png';

  return (
    <span className="inline-flex items-center">
      {/* Light-mode logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light} alt="" aria-hidden="true" className={`${className} dark:hidden`} draggable={false} />
      {/* Dark-mode logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dark} alt={branding.site_name || 'DJLink'} className={`${className} hidden dark:block`} draggable={false} />
    </span>
  );
}