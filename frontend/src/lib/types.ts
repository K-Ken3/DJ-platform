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
  momo_account_name: string;
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
  momo_number?: string | null;
  momo_ussd?: string | null;
  momo_account_name?: string | null;
};

export type BookingMessage = {
  id: number;
  dj_id?: number | null;
  dj_name?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  message?: string | null;
  created_at: string;
};

export type PublicDj = {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  bio?: string | null;
  tagline?: string | null;
  location?: string | null;
  social_links?: Record<string, string> | null;
  events?: { id: number; name: string; venue?: string | null; event_date?: string | null; event_code: string }[];
};

export type PublicDjEvent = {
  id: number;
  name: string;
  venue?: string | null;
  event_date?: string | null;
  event_code: string;
  active: number;
  request_count?: number;
};

export type DjPublicPage = {
  dj: DjProfile & { role: string; status: string };
  events: PublicDjEvent[];
  posts: BlogPost[];
};

export type SubscriptionRecord = {
  id: number;
  user_id: number;
  amount?: number | null;
  currency: string;
  phone?: string | null;
  transaction_reference?: string | null;
  payment_code?: string | null;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  submitted_at: string;
  verified_at?: string | null;
  verified_by?: number | null;
};

export type PaymentCodeRow = {
  id: number;
  code: string;
  user_id: number;
  amount?: number | null;
  currency: string;
  status: 'UNUSED' | 'USED' | 'REVOKED';
  created_at: string;
  created_by: number;
  used_at?: string | null;
  used_by?: number | null;
  dj_name?: string | null;
  dj_email?: string | null;
  dj_status?: string | null;
};

export type SuperDj = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  created_at: string | null;
  slug?: string | null;
  logo?: string | null;
  tagline?: string | null;
  location?: string | null;
  total_subscriptions: number;
  verified_subscriptions: number;
  latest_subscription?: SubscriptionRecord | null;
};

export type SuperStats = {
  total_djs: number;
  pending: number;
  active: number;
  rejected: number;
  suspended: number;
  events_total: number;
  requests_total: number;
  requests_today: number;
  bookings_total: number;
  subscriptions_total: number;
  subscriptions_verified: number;
  subscriptions_submitted: number;
};

export type RegistrationInfo = {
  subscription_fee: number;
  subscription_fee_usd: number;
  usd_rwf_rate: number;
  currency: string;
  mtn_momo_number: string;
  mtn_momo_ussd: string;
  momo_account_name: string;
};