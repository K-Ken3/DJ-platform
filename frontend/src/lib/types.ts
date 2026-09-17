export type RequestItem = {
  id: number;
  dj_id: number;
  event_id: number | null;
  song_name: string;
  artist_name: string | null;
  status: 'NEW' | 'PLAYED' | 'REJECTED';
  requested_at: string;
  played_at: string | null;
  rejected_at: string | null;
  event_name?: string | null;
};

export type EventItem = {
  id: number;
  name: string;
  venue?: string | null;
  event_date?: string | null;
  event_code: string;
  active: boolean | number;
  request_count?: number;
};

export type BlogPost = {
  id: number;
  dj_id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  category?: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  published_at?: string | null;
};

export type AdminSettings = {
  mtn_momo_number: string;
  mtn_momo_ussd: string;
  currency: string;
  suggested_tips: string[];
  tip_hint: string;
};

export type Overview = {
  total_requests: number;
  pending: number;
  songs_played: number;
  rejected: number;
  requests_today: number;
  requests_this_event: number;
  requests_this_week: number;
  active_event: EventItem | null;
};

export type DjProfile = {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  bio?: string | null;
  tagline?: string | null;
  location?: string | null;
  social_links?: string | null;
};

export type BookingMessage = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  message?: string | null;
  created_at: string;
};