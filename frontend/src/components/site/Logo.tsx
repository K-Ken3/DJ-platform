export function Logo({ className = 'h-8 w-auto' }: { className?: string }) {
  return (
    <span className="inline-flex items-center">
      {/* Black logo for light pages */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" aria-hidden="true" className={`${className} dark:hidden`} draggable={false} />
      {/* White logo for dark pages */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.png" alt="DJLink" className={`${className} hidden dark:block`} draggable={false} />
    </span>
  );
}