# ConstructIQ — General Contractor OS

AI-powered document management, bid analysis, and subcontractor communication for General Contractors.

**Stack:** Next.js 14 · Supabase · Claude (Anthropic) · Stripe · Resend · Vercel

---

## Launch in 6 Hours

### Step 1 — Accounts (30 min)

| Service | URL | What you need |
|---|---|---|
| Supabase | app.supabase.com | URL, anon key, service_role key |
| Anthropic | console.anthropic.com | API key |
| Stripe | dashboard.stripe.com | Secret key, publishable key, 3 price IDs |
| Resend | resend.com | API key, verified domain |
| Vercel | vercel.com | Free account |
| Domain | namecheap.com | constructiq.io (~$12) |

### Step 2 — Database (15 min)

1. Create Supabase project
2. Go to **SQL Editor** → paste all of `src/lib/schema.sql` → **Run**
3. Go to **Storage** → **New bucket** → name: `documents` → **Private**

### Step 3 — Stripe Products (15 min)

Create 3 products in Stripe dashboard:
- **Starter** → $49/mo recurring → copy `price_xxx` ID
- **Pro** → $99/mo recurring → copy `price_xxx` ID  
- **Company** → $249/mo recurring → copy `price_xxx` ID

Add webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
Events: `customer.subscription.created`, `.updated`, `.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### Step 4 — Local Setup (10 min)

```bash
npm install
cp .env.example .env.local
# Fill in every value in .env.local
npm run dev
# Open http://localhost:3000
```

### Step 5 — Test the Core Flow (30 min)

1. Sign up → create project
2. Upload a real permit PDF → watch AI extract fields
3. Go to Subs → add contractor → click "AI Draft" → verify reply generates
4. Settings → Upgrade to Pro → use test card `4242 4242 4242 4242`
5. Verify subscription status updates in Supabase → users table

### Step 6 — Deploy (20 min)

```bash
npm i -g vercel
vercel --prod
```

In Vercel dashboard → Settings → Environment Variables → add all vars from `.env.local`

Update these after deploy:
- `NEXT_PUBLIC_APP_URL` → your live domain
- Stripe webhook URL → `https://yourdomain.com/api/stripe/webhook`
- Supabase → Authentication → Site URL → your domain

### Step 7 — Go Live

Post in: Facebook GC groups · r/Contractor · r/GeneralContractor · LinkedIn · cold DM GCs

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── layout.tsx                   # Root layout + DM Sans font
│   ├── globals.css                  # Design system (CSS variables, components)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── dashboard/                   # Stats, alerts, budget overview
│   ├── documents/                   # Upload, AI extraction, permit tracker
│   ├── bids/                        # Line items, private AI flags, budget bars
│   ├── subs/                        # Directory, AI reply composer, email log
│   ├── training/                    # Module generator from blueprints
│   ├── email/                       # Inbox, AI draft, compose
│   ├── settings/                    # Profile, billing, SMS alerts
│   └── api/
│       ├── upload/                  # File → Supabase storage
│       ├── parse-document/          # Claude PDF extraction
│       ├── send-reply/              # AI draft + Resend email
│       ├── chat/                    # Project AI chat (full context)
│       ├── training/generate/       # Claude training module gen
│       ├── training/update/         # Publish / delete modules
│       ├── stripe/checkout/         # Create Stripe session
│       ├── stripe/portal/           # Billing portal redirect
│       ├── stripe/webhook/          # Subscription sync
│       ├── auth/welcome/            # Welcome email on signup
│       └── cron/permit-alerts/      # Daily 7am permit alerts + digest
├── components/
│   └── layout/AppShell.tsx          # Topbar, sidebar, mobile bottom nav
├── lib/
│   ├── supabase.ts                  # Browser, server, admin clients (@supabase/ssr)
│   ├── ai.ts                        # All Claude API calls (typed, error handled)
│   ├── stripe.ts                    # Checkout, portal, webhook verification
│   ├── email.ts                     # Resend templates (permit alert, digest, welcome)
│   └── schema.sql                   # Full DB schema + RLS + triggers
├── middleware.ts                    # Auth guard (getUser, not getSession)
└── types/index.ts                   # All types + PLAN_LIMITS constant
```

---

## Pricing

| | Starter $49 | Pro $99 | Company $249 |
|---|---|---|---|
| Projects | 1 | 5 | Unlimited |
| Docs/mo | 20 | Unlimited | Unlimited |
| Bid analysis | — | ✓ | ✓ |
| AI replies | — | ✓ | ✓ |
| Training hub | — | ✓ | ✓ |
| SMS alerts | — | ✓ | ✓ |
| Team seats | 1 | 1 | 5 |

---

## Environment Variables

See `.env.example` for all required variables with instructions.

Add `CRON_SECRET=any-random-string` to Vercel env vars — used to authenticate the daily cron job.

---

## Revenue Targets

- Month 1: 10 users × $99 = **$990 MRR** (cover infra costs with 2 users)
- Month 3: 50 users × $89 avg = **$4,450 MRR**
- Month 6: 200 users = **$17,800 MRR**
- Month 12: 500 users = **$44,500 MRR** / **$534K ARR**

500 users = 0.067% of 750,000 licensed GCs in the US.
