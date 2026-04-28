// ─────────────────────────────────────────────────────────
// CONSTRUCTIQ — Core Types
// Single source of truth. Every DB table mirrors these types.
// ─────────────────────────────────────────────────────────

// ── USER ──────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  plan: 'starter' | 'pro' | 'company'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  trial_ends_at: string | null
  sms_alerts_enabled: boolean
  created_at: string
  updated_at: string
}

// ── PROJECT ───────────────────────────────────────────────
export interface Project {
  id: string
  user_id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  jurisdiction: string | null
  gc_license: string | null
  total_bid: number | null
  contingency_pct: number
  status: 'active' | 'completed' | 'on_hold'
  created_at: string
  updated_at: string
}

// ── DOCUMENT ──────────────────────────────────────────────
export type DocumentType =
  | 'permit'
  | 'blueprint'
  | 'contract'
  | 'sub_bid'
  | 'inspection'
  | 'change_order'
  | 'other'

export type DocumentStatus = 'uploading' | 'processing' | 'extracted' | 'needs_review' | 'saved'

export interface Document {
  id: string
  project_id: string
  user_id: string
  name: string
  file_path: string          // Supabase storage path
  file_size: number
  file_type: string          // MIME type
  doc_type: DocumentType
  status: DocumentStatus
  extracted_data: ExtractedData | null
  ai_notes: string | null
  created_at: string
  updated_at: string
}

export interface ExtractedData {
  // Permits
  permit_number?: string
  permit_type?: string
  issued_date?: string
  expiry_date?: string
  jurisdiction?: string
  valuation?: number
  sq_footage?: number
  inspector_name?: string
  inspector_email?: string
  special_conditions?: string[]
  // Contracts / bids
  contractor_name?: string
  contractor_email?: string    // extracted from sub bid docs
  contractor_license?: string
  trade?: string               // e.g. "Structural Steel", "Electrical", "Plumbing"
  scope_summary?: string
  total_amount?: number
  start_date?: string
  completion_date?: string
  // Generic
  key_dates?: Array<{ label: string; date: string }>
  flags?: Array<{ severity: 'info' | 'warning' | 'critical'; message: string }>
  raw_fields?: Record<string, string>
}

// ── PERMIT ────────────────────────────────────────────────
export type PermitStatus = 'active' | 'pending' | 'expiring_soon' | 'expired' | 'revoked'

export interface Permit {
  id: string
  document_id: string
  project_id: string
  user_id: string
  permit_number: string
  permit_type: string
  issued_date: string | null
  expiry_date: string | null
  jurisdiction: string | null
  inspector_name: string | null
  inspector_email: string | null
  inspector_phone: string | null
  valuation: number | null
  sq_footage: number | null
  special_conditions: string[]
  status: PermitStatus
  alert_sent_30d: boolean
  alert_sent_14d: boolean
  alert_sent_7d: boolean
  created_at: string
  updated_at: string
}

// ── BID / LINE ITEM ───────────────────────────────────────
export type BidStatus = 'not_started' | 'bidding' | 'awarded' | 'revise' | 'rejected'

export interface BidLineItem {
  id: string
  project_id: string
  user_id: string
  trade: string
  scope_summary: string
  amount: number
  market_rate_low: number | null
  market_rate_high: number | null
  variance_pct: number | null          // ((amount - market_mid) / market_mid) * 100
  status: BidStatus
  ai_flag: string | null               // Internal only, never shown to subs
  ai_flag_severity: 'info' | 'warning' | 'critical' | null
  sub_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

// ── SUBCONTRACTOR ─────────────────────────────────────────
export type SubStatus = 'prospect' | 'bidding' | 'awarded' | 'active' | 'completed' | 'rejected'

export interface Subcontractor {
  id: string
  project_id: string
  user_id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  license_number: string | null
  trade: string
  status: SubStatus
  ai_score: string | null              // 'A', 'B+', 'C', etc.
  bid_amount: number | null
  market_rate: number | null
  variance_pct: number | null
  ai_notes: string | null              // Internal only
  last_contact_at: string | null
  created_at: string
  updated_at: string
}

// ── EMAIL THREAD ──────────────────────────────────────────
export type EmailDirection = 'inbound' | 'outbound'

export interface EmailThread {
  id: string
  project_id: string
  user_id: string
  sub_id: string | null
  subject: string
  from_name: string
  from_email: string
  body: string
  direction: EmailDirection
  ai_draft: string | null              // AI-generated reply, not yet sent
  sent_at: string | null
  read_at: string | null
  created_at: string
}

// ── TRAINING MODULE ───────────────────────────────────────
export type ModuleStatus = 'generating' | 'draft' | 'published'

export interface TrainingModule {
  id: string
  project_id: string
  user_id: string
  document_id: string | null           // Source document
  title: string
  module_number: number
  content: string                      // Markdown content
  status: ModuleStatus
  read_time_minutes: number | null
  created_at: string
  updated_at: string
}

// ── API RESPONSE WRAPPERS ─────────────────────────────────
export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── PLAN LIMITS ───────────────────────────────────────────
export const PLAN_LIMITS = {
  starter: {
    projects: 1,
    docs_per_month: 20,
    bid_analysis: false,
    ai_replies: false,
    training_hub: false,
    sms_alerts: false,
    team_seats: 1,
  },
  pro: {
    projects: 5,
    docs_per_month: -1,   // unlimited
    bid_analysis: true,
    ai_replies: true,
    training_hub: true,
    sms_alerts: true,
    team_seats: 1,
  },
  company: {
    projects: -1,         // unlimited
    docs_per_month: -1,
    bid_analysis: true,
    ai_replies: true,
    training_hub: true,
    sms_alerts: true,
    team_seats: 5,
  },
} as const
