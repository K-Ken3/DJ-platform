'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type SiteBranding = {
  site_logo: string;
  site_logo_dark: string;
  footer_logo: string;
  footer_logo_dark: string;
  site_name: string;
};

export const defaultBranding: SiteBranding = {
  site_logo: '/logo.png',
  site_logo_dark: '/logo-white.png',
  footer_logo: '/logo.png',
  footer_logo_dark: '/logo-white.png',
  site_name: 'DJLink',
};

type BrandingContextValue = {
  branding: SiteBranding;
  refresh: () => Promise<void>;
};

const BrandingContext = createContext<BrandingContextValue>({
  branding: defaultBranding,
  refresh: async () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<SiteBranding>(defaultBranding);

  const refresh = async () => {
    try {
      const data = await api<{ branding: Partial<SiteBranding> }>('/api/site-branding');
      setBranding((current) => ({ ...defaultBranding, ...current, ...(data.branding || {}) }));
    } catch {
      // keep current branding
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return <BrandingContext.Provider value={{ branding, refresh }}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}