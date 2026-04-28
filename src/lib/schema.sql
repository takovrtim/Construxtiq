-- ─────────────────────────────────────────────────────────
-- CONSTRUCTIQ — Complete Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Order matters: run top to bottom once.
-- ─────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS (extends Supabase auth.users) ───────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL UNIQUE,
  full_name             TEXT,
  company_name          TEXT,
  phone                 TEXT,
  plan                  TEXT NOT NULL DEFAULT 'pro' CHECK (plan IN ('starter','pro','company')),
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status   TEXT NOT NULL DEFAULT 'trialing'
                          CHECK (subscription_status IN ('trialing','active','past_due','canceled','unpaid')),
  trial_ends_at         TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  sms_alerts_enabled    BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PROJECTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  jurisdiction    TEXT,
  gc_license      TEXT,
  total_bid       NUMERIC(12,2),
  contingency_pct NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','on_hold')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);

-- ── DOCUMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  file_size       INTEGER NOT NULL,
  file_type       TEXT NOT NULL,
  doc_type        TEXT NOT NULL DEFAULT 'other'
                    CHECK (doc_type IN ('permit','blueprint','contract','sub_bid','inspection','change_order','other')),
  status          TEXT NOT NULL DEFAULT 'uploading'
                    CHECK (status IN ('uploading','processing','extracted','needs_review','saved')),
  extracted_data  JSONB,
  ai_notes        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_project_id ON public.documents(project_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);

-- ── PERMITS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id         UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  project_id          UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permit_number       TEXT NOT NULL,
  permit_type         TEXT NOT NULL,
  issued_date         DATE,
  expiry_date         DATE,
  jurisdiction        TEXT,
  inspector_name      TEXT,
  inspector_email     TEXT,
  inspector_phone     TEXT,
  valuation           NUMERIC(12,2),
  sq_footage          INTEGER,
  special_conditions  TEXT[] NOT NULL DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','pending','expiring_soon','expired','revoked')),
  alert_sent_30d      BOOLEAN NOT NULL DEFAULT false,
  alert_sent_14d      BOOLEAN NOT NULL DEFAULT false,
  alert_sent_7d       BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permits_project_id ON public.permits(project_id);
CREATE INDEX idx_permits_expiry_date ON public.permits(expiry_date);
CREATE INDEX idx_permits_status ON public.permits(status);

-- ── BID LINE ITEMS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bid_line_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trade               TEXT NOT NULL,
  scope_summary       TEXT NOT NULL DEFAULT '',
  amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  market_rate_low     NUMERIC(12,2),
  market_rate_high    NUMERIC(12,2),
  variance_pct        NUMERIC(6,2),
  status              TEXT NOT NULL DEFAULT 'not_started'
                        CHECK (status IN ('not_started','bidding','awarded','revise','rejected')),
  ai_flag             TEXT,
  ai_flag_severity    TEXT CHECK (ai_flag_severity IN ('info','warning','critical')),
  sub_id              UUID,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bid_items_project_id ON public.bid_line_items(project_id);

-- ── SUBCONTRACTORS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name      TEXT NOT NULL,
  contact_name      TEXT,
  email             TEXT,
  phone             TEXT,
  license_number    TEXT,
  trade             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'prospect'
                      CHECK (status IN ('prospect','bidding','awarded','active','completed','rejected')),
  ai_score          TEXT,
  bid_amount        NUMERIC(12,2),
  market_rate       NUMERIC(12,2),
  variance_pct      NUMERIC(6,2),
  ai_notes          TEXT,
  last_contact_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subs_project_id ON public.subcontractors(project_id);

-- ── EMAIL THREADS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_threads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sub_id      UUID REFERENCES public.subcontractors(id) ON DELETE SET NULL,
  subject     TEXT NOT NULL,
  from_name   TEXT NOT NULL,
  from_email  TEXT NOT NULL,
  body        TEXT NOT NULL,
  direction   TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound','outbound')),
  ai_draft    TEXT,
  sent_at     TIMESTAMPTZ,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emails_project_id ON public.email_threads(project_id);
CREATE INDEX idx_emails_user_id ON public.email_threads(user_id);

-- ── TRAINING MODULES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_modules (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_id         UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  module_number       INTEGER NOT NULL DEFAULT 1,
  content             TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'generating'
                        CHECK (status IN ('generating','draft','published')),
  read_time_minutes   INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modules_project_id ON public.training_modules(project_id);

-- ── AUTO-UPDATE updated_at ────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER permits_updated_at BEFORE UPDATE ON public.permits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bid_items_updated_at BEFORE UPDATE ON public.bid_line_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subs_updated_at BEFORE UPDATE ON public.subcontractors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER modules_updated_at BEFORE UPDATE ON public.training_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── AUTO-CREATE USER PROFILE ON SIGNUP ───────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── AUTO-UPDATE PERMIT STATUS ─────────────────────────────
CREATE OR REPLACE FUNCTION update_permit_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status = 'expired';
    ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status = 'expiring_soon';
    ELSE
      NEW.status = 'active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER permit_status_update
  BEFORE INSERT OR UPDATE ON public.permits
  FOR EACH ROW EXECUTE FUNCTION update_permit_status();

-- ── ROW LEVEL SECURITY ────────────────────────────────────
-- Users can only see and modify their own data. Period.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

-- Users: read/update own profile only
CREATE POLICY "users_own" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Projects: full access to own projects
CREATE POLICY "projects_own" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- Documents: full access to own documents
CREATE POLICY "documents_own" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- Permits: full access to own permits
CREATE POLICY "permits_own" ON public.permits
  FOR ALL USING (auth.uid() = user_id);

-- Bid line items: full access to own items
CREATE POLICY "bids_own" ON public.bid_line_items
  FOR ALL USING (auth.uid() = user_id);

-- Subcontractors: full access to own subs
CREATE POLICY "subs_own" ON public.subcontractors
  FOR ALL USING (auth.uid() = user_id);

-- Email threads: full access to own emails
CREATE POLICY "emails_own" ON public.email_threads
  FOR ALL USING (auth.uid() = user_id);

-- Training modules: full access to own modules
CREATE POLICY "modules_own" ON public.training_modules
  FOR ALL USING (auth.uid() = user_id);

-- ── STORAGE BUCKET ────────────────────────────────────────
-- Run this separately after creating the bucket in Supabase dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "users_own_documents"
  ON storage.objects FOR ALL
  USING (auth.uid()::text = (storage.foldername(name))[1]);
