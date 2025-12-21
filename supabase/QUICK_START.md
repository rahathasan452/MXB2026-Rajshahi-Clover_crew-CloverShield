# Supabase Quick Start Checklist

Quick reference for setting up CloverShield Supabase backend.

## ✅ Setup Steps

### 1. Create Supabase Project
- [ ] Go to [app.supabase.com](https://app.supabase.com)
- [ ] Click "New Project"
- [ ] Fill in project details
- [ ] Wait for provisioning (2-3 minutes)

### 2. Run Migrations
- [ ] Open SQL Editor in Supabase dashboard
- [ ] Run `migrations/001_initial_schema.sql`
- [ ] Run `migrations/002_rls_policies.sql`
- [ ] Run `migrations/003_seed_data.sql` (optional)

### 3. Verify Tables
- [ ] Go to Table Editor
- [ ] Verify 8 tables exist:
  - [ ] users
  - [ ] transactions
  - [ ] transaction_features
  - [ ] shap_explanations
  - [ ] llm_explanations
  - [ ] analyst_actions
  - [ ] flagged_accounts
  - [ ] analytics_snapshots

### 4. Configure Auth
- [ ] Go to Authentication → Providers
- [ ] Enable Email authentication
- [ ] (Optional) Enable social providers
- [ ] Set Site URL and Redirect URLs

### 5. Get API Keys
- [ ] Go to Project Settings → API
- [ ] Copy Project URL
- [ ] Copy anon/public key
- [ ] Copy service_role key (keep secret!)
- [ ] Add to `.env.local` (use `env.template` as reference)

### 6. Test Setup
- [ ] Run `scripts/verify_setup.sql` in SQL Editor
- [ ] Verify all checks pass
- [ ] Test inserting a user
- [ ] Test querying users

## 📋 Files Created

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql      ✅ Database tables
│   ├── 002_rls_policies.sql       ✅ Security policies
│   ├── 003_seed_data.sql          ✅ Demo data
│   └── 004_auth_integration.sql    ✅ Auth helpers (optional)
├── scripts/
│   └── verify_setup.sql            ✅ Verification script
├── SUPABASE_SETUP_GUIDE.md        ✅ Complete guide
├── README.md                       ✅ Overview
├── QUICK_START.md                 ✅ This file
└── env.template                    ✅ Environment variables template
```

## 🔑 Required API Keys

After setup, you'll have:
- **Project URL**: `https://xxxxx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ⚠️ Keep secret!

## 🚨 Important Notes

1. **Never commit API keys** to version control
2. **Service role key** = server-side only
3. **Anon key** = safe for client-side (RLS protects data)
4. **RLS is enabled** on all tables for security

## 📚 Full Documentation

See [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) for detailed instructions.

## ✅ Ready When

- [x] All 8 tables created
- [x] RLS policies enabled
- [x] API keys copied
- [x] Test queries work
- [x] Auth configured

**Status**: Ready for frontend integration! 🚀

