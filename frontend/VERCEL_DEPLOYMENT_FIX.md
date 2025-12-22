# Vercel Deployment Fix Guide

## ✅ Issue Fixed

The `vercel.json` file has been fixed. The previous configuration used `@secret_name` syntax which only works with Vercel CLI, not the Vercel dashboard. This was causing the 404 NOT_FOUND error.

## 🚀 Deployment Steps

### Step 1: Set Root Directory in Vercel

Since your frontend is in a subdirectory:

1. Go to your project in **Vercel Dashboard**
2. Click **Settings** → **General**
3. Scroll to **Root Directory**
4. Set it to: `frontend`
5. Click **Save**

### Step 2: Fix Environment Variables (CRITICAL)

**⚠️ IMPORTANT:** If you see the error "references Secret 'supabase_url', which does not exist", you need to REMOVE and RE-ADD your environment variables.

#### Step 2a: Remove Old Variables (if they exist)

1. Go to **Settings** → **Environment Variables**
2. **DELETE** any variables that have values starting with `@` (like `@supabase_url`)
3. These are secret references that don't work in the dashboard

#### Step 2b: Add Environment Variables with Actual Values

**IMPORTANT:** You MUST use ACTUAL VALUES, not `@secret_name` syntax:

1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add the following variables with REAL VALUES:

#### Required Variables (use ACTUAL values, NOT @secret_name):

**Variable 1:**
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://xxxxx.supabase.co` (your actual Supabase URL)
- **❌ WRONG:** `@supabase_url`
- **✅ CORRECT:** `https://abcdefghijklmnop.supabase.co`

**Variable 2:**
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your actual key)
- **❌ WRONG:** `@supabase_anon_key`
- **✅ CORRECT:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxx`

**Variable 3:**
- **Key:** `NEXT_PUBLIC_ML_API_URL`
- **Value:** `https://your-ml-api.onrender.com` (your actual ML API URL)
- **❌ WRONG:** `@ml_api_url`
- **✅ CORRECT:** `https://clovershield-ml-api.onrender.com`

#### Optional Variables (use ACTUAL values):

**Variable 4 (Optional):**
- **Key:** `NEXT_PUBLIC_POSTHOG_KEY`
- **Value:** `phc_xxxxxxxxxxxxx` (your actual PostHog key)
- **❌ WRONG:** `@posthog_key`
- **✅ CORRECT:** `phc_abcdefghijklmnop1234567890`

**Variable 5 (Optional):**
- **Key:** `NEXT_PUBLIC_POSTHOG_HOST`
- **Value:** `https://app.posthog.com` (usually this value)

**Variable 6 (Optional):**
- **Key:** `RESEND_API_KEY`
- **Value:** `re_xxxxxxxxxxxxx` (your actual Resend key)
- **❌ WRONG:** `@resend_api_key`
- **✅ CORRECT:** `re_abcdefghijklmnop1234567890`

**Variable 7 (Optional):**
- **Key:** `RESEND_FROM_EMAIL`
- **Value:** `alerts@yourdomain.com` (your actual email)

**Variable 8 (Optional):**
- **Key:** `RESEND_TO_EMAIL`
- **Value:** `security@yourdomain.com` (your actual email)

4. For each variable:
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**
   - **VERIFY** the value doesn't start with `@`

### Step 3: Deploy

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment, OR
3. Push a new commit to trigger automatic deployment

### Step 4: Verify Build Settings

Vercel should auto-detect Next.js, but verify:

- **Framework Preset:** Next.js ✅
- **Root Directory:** `frontend` ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅
- **Install Command:** `npm install` ✅

## 🔍 What Was Fixed

**Before (causing 404 error):**
```json
{
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",  // ❌ This syntax doesn't work in dashboard
    ...
  }
}
```

**After (fixed):**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"]
  // ✅ Environment variables set in dashboard, not in vercel.json
}
```

## 📝 Notes

- Environment variables with `@` prefix only work with Vercel CLI secrets
- For dashboard deployments, set variables in **Settings → Environment Variables**
- The `vercel.json` file is now simplified and compatible with dashboard deployments
- Next.js projects typically don't need a `vercel.json` file, but having one doesn't hurt

## ✅ Verification

After deployment:

1. Check that the site loads at your Vercel URL
2. Verify no 404 errors in browser console
3. Test that environment variables are accessible
4. Check build logs for any warnings

## 🐛 If Still Getting "references Secret" Error

**This error means environment variables are set with `@secret_name` syntax:**

1. **Go to Vercel Dashboard** → **Settings** → **Environment Variables**
2. **Check each variable:**
   - If value starts with `@` (like `@supabase_url`), it's WRONG
   - Delete that variable
   - Add it again with the ACTUAL value (like `https://xxxxx.supabase.co`)
3. **Verify:** After adding, the value should be a real URL/key, NOT `@something`
4. **Redeploy** after fixing all variables

## 🐛 If Still Getting 404

1. **Verify Root Directory:** Must be set to `frontend` in Vercel settings
2. **Check Build Logs:** Look for errors during build
3. **Verify package.json:** Ensure it exists in `frontend/` directory
4. **Clear Cache:** Try redeploying or clearing Vercel cache
5. **Check Framework Detection:** Ensure Next.js is detected correctly
6. **Verify Environment Variables:** Make sure none use `@secret_name` syntax

---

**Status:** Fixed! Ready to deploy! 🚀

