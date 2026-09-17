'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-0 backdrop-blur-xs sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={`w-full border border-zinc-200 bg-white shadow-lift-lg dark:border-zinc-800 dark:bg-zinc-900 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
          <h2 className="text-base font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost -mr-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  children,
  label = 'Are you sure? This cannot be undone.',
  className = 'btn-danger btn-sm',
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        if (window.confirm(label)) onConfirm();
      }}
    >
      {children}
    </button>
  );
}