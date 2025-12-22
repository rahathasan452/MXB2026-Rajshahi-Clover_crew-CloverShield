# 🚨 Quick Fix: Environment Variable Error

## Error Message
```
Environment Variable "NEXT_PUBLIC_SUPABASE_URL" references Secret "supabase_url", which does not exist.
```

## ✅ Solution (5 Minutes)

### Step 1: Go to Vercel Dashboard
1. Open [vercel.com](https://vercel.com)
2. Sign in to your account
3. Select your project

### Step 2: Remove Bad Environment Variables
1. Click **Settings** → **Environment Variables**
2. Look for variables with values starting with `@` (like `@supabase_url`)
3. **Delete** all variables that have `@` in their value
4. Click the trash icon next to each one

### Step 3: Add Environment Variables with REAL Values

Click **Add New** for each variable below:

#### Variable 1: Supabase URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Your actual Supabase URL (starts with `https://`)
  - Example: `https://abcdefghijklmnop.supabase.co`
  - ❌ **DON'T USE:** `@supabase_url`
  - ✅ **USE:** Your real Supabase project URL
- **Environments:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 2: Supabase Anon Key
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Your actual Supabase anon key (long JWT token)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxx`
  - ❌ **DON'T USE:** `@supabase_anon_key`
  - ✅ **USE:** Your real Supabase anon key from dashboard
- **Environments:** Select all
- Click **Save**

#### Variable 3: ML API URL
- **Key:** `NEXT_PUBLIC_ML_API_URL`
- **Value:** Your actual ML API URL
  - Example: `https://clovershield-ml-api.onrender.com`
  - ❌ **DON'T USE:** `@ml_api_url`
  - ✅ **USE:** Your real ML API deployment URL
- **Environments:** Select all
- Click **Save**

### Step 4: Verify
1. Check that NO variable values start with `@`
2. All values should be real URLs or keys
3. Go to **Deployments** tab
4. Click **Redeploy** on the latest deployment

### Step 5: Check Build
1. Wait for deployment to complete
2. Check build logs - should not show secret errors
3. Your site should deploy successfully!

## 📍 Where to Find Your Values

### Supabase URL & Key:
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### ML API URL:
- Check your ML API deployment (Render, Railway, etc.)
- Copy the full URL (e.g., `https://your-api.onrender.com`)

## ⚠️ Important Notes

- **Never use `@secret_name` syntax in Vercel Dashboard**
- **Always use actual values** (URLs, keys, tokens)
- The `@` syntax only works with Vercel CLI, not the dashboard
- After fixing, you MUST redeploy for changes to take effect

## ✅ Success Checklist

- [ ] All environment variables deleted that had `@` values
- [ ] All variables re-added with real values
- [ ] No variables have `@` in their value
- [ ] Redeployed the project
- [ ] Build completes without errors
- [ ] Site loads successfully

---

**After completing these steps, your deployment should work!** 🚀

