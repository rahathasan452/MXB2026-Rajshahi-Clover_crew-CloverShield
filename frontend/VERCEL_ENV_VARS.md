# Vercel Environment Variables

Complete list of environment variables needed for Vercel deployment.

## 🔑 Required Variables

### Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL
```
- **Value:** Your Supabase project URL
- **Example:** `https://xxxxx.supabase.co`
- **Where to find:** Supabase Dashboard → Project Settings → API → Project URL
- **Required:** Yes
- **Environment:** Production, Preview, Development

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
- **Value:** Your Supabase anon/public key
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Project Settings → API → anon public key
- **Required:** Yes
- **Environment:** Production, Preview, Development

### ML API Configuration

```
NEXT_PUBLIC_ML_API_URL
```
- **Value:** Your deployed ML API URL
- **Example:** `https://clovershield-ml-api.onrender.com`
- **Where to find:** Your ML API deployment URL (Render, Railway, etc.)
- **Required:** Yes
- **Environment:** Production, Preview, Development

## 🎯 Optional Variables

### PostHog Analytics

```
NEXT_PUBLIC_POSTHOG_KEY
```
- **Value:** PostHog project API key
- **Example:** `phc_xxxxxxxxxxxxx`
- **Where to find:** PostHog Dashboard → Project Settings → API Key
- **Required:** No (analytics disabled if not set)
- **Environment:** Production, Preview, Development

```
NEXT_PUBLIC_POSTHOG_HOST
```
- **Value:** PostHog API host
- **Example:** `https://app.posthog.com`
- **Default:** `https://app.posthog.com`
- **Required:** No
- **Environment:** Production, Preview, Development

### Resend Email

```
RESEND_API_KEY
```
- **Value:** Resend API key
- **Example:** `re_xxxxxxxxxxxxx`
- **Where to find:** Resend Dashboard → API Keys
- **Required:** No (emails disabled if not set)
- **Environment:** Production, Preview, Development
- **Note:** Server-side only (no NEXT_PUBLIC_ prefix)

```
RESEND_FROM_EMAIL
```
- **Value:** Sender email address
- **Example:** `alerts@yourdomain.com`
- **Where to find:** Your verified domain in Resend
- **Required:** No (uses default if not set)
- **Environment:** Production, Preview, Development

```
RESEND_TO_EMAIL
```
- **Value:** Recipient email address
- **Example:** `security@yourdomain.com`
- **Where to find:** Your security team email
- **Required:** No (uses default if not set)
- **Environment:** Production, Preview, Development

### Google Analytics (Alternative)

```
NEXT_PUBLIC_GA_ID
```
- **Value:** Google Analytics Measurement ID
- **Example:** `G-XXXXXXXXXX`
- **Where to find:** Google Analytics → Admin → Data Streams
- **Required:** No
- **Environment:** Production, Preview, Development

## 📝 How to Add in Vercel

### Via Dashboard

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   - **Key:** Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value:** Variable value
   - **Environments:** Select Production, Preview, Development
5. Click **Save**
6. **Redeploy** the project

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter value when prompted

# Pull environment variables
vercel env pull .env.local
```

## ✅ Verification

After adding variables:

1. **Redeploy** the project
2. **Check build logs** for variable access
3. **Test in browser** console:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```
4. **Verify** variables are accessible

## 🔒 Security Notes

1. **Never commit** `.env.local` to Git
2. **Use Vercel** environment variables for production
3. **Rotate keys** regularly
4. **Use different keys** for development/production
5. **Restrict access** to Vercel project settings

## 📋 Quick Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `NEXT_PUBLIC_ML_API_URL` set
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` set (optional)
- [ ] `RESEND_API_KEY` set (optional)
- [ ] All variables added to Production environment
- [ ] All variables added to Preview environment
- [ ] Project redeployed after adding variables

---

**Status**: Ready for configuration! 🔧

