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

export type DayCount = { day: string; n: number };
export type SongCount = { song_name: string; artist_name: string; times: number };

export type NotificationItem = {
  id: string;
  kind: 'error' | 'warning' | 'info' | 'success';
  title: string;
  body: string;
  user_id?: number;
  action?: string;
  created_at?: string;
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
  period_start?: string | null;
  period_end?: string | null;
  submitted_at: string;
  verified_at?: string | null;
  verified_by?: number | null;
};

export type SubscriptionState = {
  paid: boolean;
  expired: boolean;
  renewalDue: boolean;
  daysSincePayment: number | null;
  paidAt?: string | null;
  reminderAt?: string | null;
  cutoffAt?: string | null;
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
  sub_state?: SubscriptionState | null;
  sub_expired?: boolean;
  sub_renewal_due?: boolean;
};

export type SuperRenewal = {
  user_id: number;
  name: string;
  email: string;
  slug?: string | null;
  phone?: string | null;
  latest_subscription?: SubscriptionRecord | null;
  state: SubscriptionState;
  needs_action: boolean;
  includes_expired: boolean;
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
  revenue_total: number;
  revenue_usd_estimate: number;
  renewals_due: number;
  renewals_expired: number;
  top_songs?: SongCount[];
  requests_by_day?: DayCount[];
};

export type RegistrationInfo = {
  subscription_fee: number;
  subscription_fee_usd: number;
  usd_rwf_rate: number;
  currency: string;
  free_trial_days: number;
  mtn_momo_number: string;
  momo_account_name: string;
};