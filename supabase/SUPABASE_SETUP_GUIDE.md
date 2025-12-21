# Supabase Setup Guide for CloverShield

Complete step-by-step guide to set up Supabase backend for CloverShield migration.

---

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com) (free tier available)
2. **Git**: For version control (optional)
3. **SQL Editor Access**: You'll need access to Supabase SQL Editor

---

## Step 1: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `clovershield` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `Southeast Asia (Singapore)`)
   - **Pricing Plan**: Free tier is sufficient for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for project provisioning

---

## Step 2: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended for First Time)

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `supabase/migrations/001_initial_schema.sql` from this repository
4. Copy the entire contents and paste into SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. Verify success: You should see "Success. No rows returned"
7. Repeat for `002_rls_policies.sql`
8. Repeat for `003_seed_data.sql` (optional, for demo data)

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

## Step 3: Verify Tables Created

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - ✅ `users`
   - ✅ `transactions`
   - ✅ `transaction_features`
   - ✅ `shap_explanations`
   - ✅ `llm_explanations`
   - ✅ `analyst_actions`
   - ✅ `flagged_accounts`
   - ✅ `analytics_snapshots`

3. Click on `users` table and verify it has 15 rows (if you ran seed data)

---

## Step 4: Configure Authentication

### 4.1 Enable Email Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Under **Email**, ensure it's **Enabled**
3. Configure email templates (optional):
   - **Confirm signup**: Customize welcome email
   - **Reset password**: Customize password reset email

### 4.2 (Optional) Enable Social Providers

For demo purposes, you can enable:
- **Google OAuth**
- **GitHub OAuth**

1. Go to **Authentication** → **Providers**
2. Enable desired provider
3. Follow setup instructions (requires OAuth credentials)

### 4.3 Configure Auth Settings

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://your-production-domain.com/**`

---

## Step 5: Configure Row Level Security (RLS)

RLS policies are already created in `002_rls_policies.sql`. Verify:

1. Go to **Authentication** → **Policies**
2. Or check in **SQL Editor**:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

### Adjust RLS Policies (If Needed)

**For Public Demo Access** (less secure, but easier for demos):

```sql
-- Allow anonymous reads on users table
CREATE POLICY "Anonymous can read users"
    ON users
    FOR SELECT
    USING (true);

-- Allow anonymous reads on transactions
CREATE POLICY "Anonymous can read transactions"
    ON transactions
    FOR SELECT
    USING (true);
```

**For Production** (more secure):
- Keep existing RLS policies
- Ensure users authenticate before accessing data
- Use service role key for backend operations

---

## Step 6: Get API Keys

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values (you'll need them for frontend):

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ⚠️ **Keep secret!**

3. Create `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 7: Test Database Connection

### Using Supabase Dashboard

1. Go to **Table Editor** → `users`
2. Click **"Insert row"**
3. Add a test user:
   ```json
   {
     "user_id": "TEST001",
     "name_en": "Test User",
     "phone": "+8801711111111",
     "provider": "bKash",
     "balance": 10000.00
   }
   ```
4. Click **"Save"**
5. Verify the row appears

### Using SQL Query

```sql
-- Test query
SELECT * FROM users LIMIT 5;

-- Test insert
INSERT INTO users (user_id, name_en, phone, provider, balance)
VALUES ('TEST002', 'Test User 2', '+8801722222222', 'Nagad', 20000.00);

-- Verify
SELECT * FROM users WHERE user_id = 'TEST002';
```

---

## Step 8: Set Up Database Functions (Optional)

For advanced features, you can create helper functions:

```sql
-- Function to get user transaction history
CREATE OR REPLACE FUNCTION get_user_transactions(
    p_user_id VARCHAR(20),
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    transaction_id UUID,
    sender_id VARCHAR(20),
    receiver_id VARCHAR(20),
    amount DECIMAL(15,2),
    transaction_type VARCHAR(20),
    transaction_timestamp TIMESTAMP WITH TIME ZONE,
    fraud_probability DECIMAL(5,4),
    fraud_decision VARCHAR(10)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.transaction_id,
        t.sender_id,
        t.receiver_id,
        t.amount,
        t.transaction_type,
        t.transaction_timestamp,
        t.fraud_probability,
        t.fraud_decision
    FROM transactions t
    WHERE t.sender_id = p_user_id OR t.receiver_id = p_user_id
    ORDER BY t.transaction_timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Step 9: Configure Storage (If Needed)

If you plan to store files (e.g., transaction receipts):

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket: `transaction-receipts`
3. Set bucket to **Public** (or configure policies)
4. Add RLS policies for access control

---

## Step 10: Set Up Realtime (Optional)

For real-time transaction updates:

1. Go to **Database** → **Replication**
2. Enable replication for `transactions` table
3. In your frontend, subscribe to changes:

```typescript
import { RealtimeChannel } from '@supabase/supabase-js'

const channel = supabase
  .channel('transactions')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'transactions' },
    (payload) => {
      console.log('New transaction:', payload.new)
    }
  )
  .subscribe()
```

---

## Verification Checklist

- [ ] All 8 tables created successfully
- [ ] RLS policies enabled on all tables
- [ ] Seed data inserted (15 users)
- [ ] API keys copied to `.env.local`
- [ ] Test query works in SQL Editor
- [ ] Authentication providers configured
- [ ] Project URL and keys accessible

---

## Troubleshooting

### Issue: "Permission denied" when querying tables

**Solution**: Check RLS policies. For development, you can temporarily disable RLS:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

⚠️ **Don't do this in production!**

### Issue: "Foreign key constraint violation"

**Solution**: Ensure you're inserting data in the correct order:
1. Users first
2. Transactions second
3. Features/Explanations last

### Issue: "Column does not exist"

**Solution**: Verify migration ran successfully. Check table structure:

```sql
\d users  -- PostgreSQL command
-- Or in Supabase: Table Editor → View table structure
```

### Issue: API keys not working

**Solution**: 
- Verify you're using the correct key (anon vs service_role)
- Check CORS settings in Project Settings → API
- Ensure RLS policies allow your operation

---

## Next Steps

1. ✅ **Database Setup Complete** → Proceed to Frontend Integration
2. 📝 **Update Frontend** → Use Supabase client library
3. 🔗 **Connect ML API** → Integrate with prediction service
4. 🚀 **Deploy** → Set up production environment variables

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Service role key** should only be used server-side
4. **Anon key** is safe for client-side (RLS protects data)
5. **Enable 2FA** on your Supabase account
6. **Regular backups** (Supabase handles this automatically)

---

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

---

**Status**: ✅ Ready for Frontend Integration

