# CloverShield Supabase Backend

Complete Supabase backend setup for CloverShield fraud detection platform.

## 📁 Directory Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql      # Database tables and indexes
│   ├── 002_rls_policies.sql        # Row Level Security policies
│   └── 003_seed_data.sql           # Mock data for development
├── SUPABASE_SETUP_GUIDE.md         # Complete setup instructions
├── .env.example                     # Environment variables template
└── README.md                        # This file
```

## 🚀 Quick Start

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for provisioning (2-3 minutes)

2. **Run Migrations**
   - Open Supabase SQL Editor
   - Run `001_initial_schema.sql`
   - Run `002_rls_policies.sql`
   - Run `003_seed_data.sql` (optional)

3. **Get API Keys**
   - Project Settings → API
   - Copy Project URL and API keys
   - Add to `.env.local`

4. **Verify Setup**
   - Check Table Editor (should see 8 tables)
   - Run test query in SQL Editor

## 📚 Documentation

- **[SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)** - Complete setup guide
- **[MIGRATION_SPECIFICATION.md](../MIGRATION_SPECIFICATION.md)** - Full schema documentation

## 🗄️ Database Schema

### Tables

1. **users** - User account information
2. **transactions** - Transaction records with ML results
3. **transaction_features** - Engineered ML features cache
4. **shap_explanations** - SHAP feature contributions
5. **llm_explanations** - Human-readable LLM explanations
6. **analyst_actions** - Analyst action tracking
7. **flagged_accounts** - Accounts flagged for review
8. **analytics_snapshots** - Daily aggregated metrics

### Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only view their own transactions
- Service role has full access for backend operations
- Policies defined in `002_rls_policies.sql`

## 🔑 API Keys

After setup, you'll need these keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Never commit API keys to version control!**

## 🔄 Migration Order

Run migrations in this order:

1. `001_initial_schema.sql` - Creates all tables
2. `002_rls_policies.sql` - Sets up security policies
3. `003_seed_data.sql` - Inserts demo data (optional)

## 🧪 Testing

### Test Database Connection

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check user count
SELECT COUNT(*) FROM users;

-- Test transaction insert
INSERT INTO transactions (
    sender_id, receiver_id, amount, transaction_type,
    old_balance_orig, new_balance_orig, old_balance_dest, new_balance_dest,
    status
) VALUES (
    'C123456789', 'C234567890', 1000.00, 'TRANSFER',
    50000.00, 49000.00, 25000.00, 26000.00,
    'PENDING'
);
```

## 🔐 Security Notes

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Service Role Key**: Only use server-side, never expose to client
3. **Anon Key**: Safe for client-side (RLS protects data)
4. **Environment Variables**: Store all secrets in `.env.local`

## 📊 Seed Data

The `003_seed_data.sql` file includes:
- 15 mock users (matching `demo/mock_data.py`)
- Sample transaction history
- Initial analytics snapshot

Remove or modify for production use.

## 🛠️ Troubleshooting

See [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) for troubleshooting section.

## 📖 Related Documentation

- [Migration Specification](../MIGRATION_SPECIFICATION.md) - Complete feature mapping
- [Supabase Docs](https://supabase.com/docs) - Official documentation

## ✅ Status

- [x] Database schema defined
- [x] RLS policies configured
- [x] Seed data prepared
- [x] Setup guide complete
- [ ] Frontend integration (next step)
- [ ] ML API integration (next step)

---

**Ready for Frontend Integration!** 🚀

