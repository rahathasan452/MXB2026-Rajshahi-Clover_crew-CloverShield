# Integrations Guide

Complete guide for setting up PostHog analytics and Resend email notifications.

## 📊 PostHog Analytics Setup

### 1. Create PostHog Account

1. Go to [posthog.com](https://posthog.com)
2. Sign up for free account
3. Create a new project
4. Copy your **Project API Key**

### 2. Configure Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 3. Verify Setup

1. Start your Next.js app: `npm run dev`
2. Open browser console
3. Look for: `✅ PostHog analytics initialized`
4. Perform a transaction
5. Check PostHog dashboard for events

### 4. Tracked Events

The following events are automatically tracked:

- `transaction_processed` - Every transaction analysis
- `transaction_blocked` - Blocked transactions
- `transaction_warned` - Warned transactions
- `transaction_approved` - Approved transactions
- `ml_api_call` - ML API calls (success/failure)
- `page_view` - Page views
- `analytics_viewed` - Analytics dashboard views

### 5. View Analytics

- Go to PostHog dashboard
- Navigate to **Events** or **Insights**
- Filter by event name or properties
- Create custom dashboards

## 📧 Resend Email Setup

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free account (100 emails/day free)
3. Verify your domain (or use test domain)
4. Go to **API Keys** and create a new key
5. Copy your **API Key**

### 2. Configure Domain (Optional)

For production:
1. Add your domain in Resend dashboard
2. Add DNS records (SPF, DKIM)
3. Verify domain
4. Use verified domain in `RESEND_FROM_EMAIL`

For testing:
- Use `onboarding@resend.dev` (no verification needed)

### 3. Configure Environment Variables

Add to `.env.local`:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=alerts@yourdomain.com
RESEND_TO_EMAIL=security@yourdomain.com
```

**Note:** `RESEND_API_KEY` is server-side only (no `NEXT_PUBLIC_` prefix)

### 4. Email Triggers

Emails are automatically sent when:
- Transaction decision is `BLOCK` (high risk)
- Transaction decision is `WARN` (medium risk)

Emails are **NOT** sent for:
- `PASS` decisions (low risk)

### 5. Email Content

Each email includes:
- Transaction details (ID, sender, receiver, amount)
- Risk assessment (fraud probability, risk level)
- Top risk factors (from SHAP explanations)
- Action required/ taken

### 6. Test Email Sending

1. Process a transaction with high fraud probability
2. Check server logs for email API calls
3. Check Resend dashboard → **Emails** for sent emails
4. Verify email received at `RESEND_TO_EMAIL`

## 🔧 Google Analytics (Alternative)

If you prefer Google Analytics over PostHog:

### 1. Create GA4 Property

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create new GA4 property
3. Get **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Configure Environment

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. Enable in Code

Uncomment Google Analytics initialization in `lib/analytics.ts`:

```typescript
// In AnalyticsProvider or layout
initGoogleAnalytics()
```

## ✅ Verification Checklist

### PostHog
- [ ] PostHog account created
- [ ] API key added to `.env.local`
- [ ] Console shows "PostHog analytics initialized"
- [ ] Events appear in PostHog dashboard
- [ ] Transaction events tracked correctly

### Resend
- [ ] Resend account created
- [ ] API key added to `.env.local`
- [ ] Email addresses configured
- [ ] Test transaction triggers email
- [ ] Email received successfully
- [ ] Email content is correct

## 🐛 Troubleshooting

### PostHog Not Tracking

**Issue:** No events in PostHog dashboard

**Solutions:**
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set
3. Check PostHog project is active
4. Verify CORS settings in PostHog
5. Check network tab for API calls

### Emails Not Sending

**Issue:** No emails received

**Solutions:**
1. Check `RESEND_API_KEY` is set (server-side)
2. Verify API key is valid in Resend dashboard
3. Check Resend API rate limits
4. Review server logs for errors
5. Verify email addresses are valid
6. Check spam folder

### Email API Route Errors

**Issue:** 500 error from `/api/send-alert-email`

**Solutions:**
1. Verify `RESEND_API_KEY` environment variable
2. Check Resend API key permissions
3. Review Next.js server logs
4. Test Resend API directly with curl

## 📊 Event Properties

### Transaction Events

```typescript
{
  transaction_id: string
  sender_id: string
  receiver_id: string
  amount: number
  transaction_type: string
  fraud_probability: number
  decision: 'pass' | 'warn' | 'block'
  risk_level: string
}
```

### ML API Events

```typescript
{
  success: boolean
  processing_time_ms: number
  error?: string
}
```

## 🔒 Security Notes

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Use `.env.local` for local development
3. **Server-Side**: Resend API key should only be server-side
4. **Client-Side**: PostHog key can be public (it's designed for client-side)

## 📈 Usage Limits

### PostHog Free Tier
- 1M events/month
- Unlimited users
- 14-day data retention

### Resend Free Tier
- 100 emails/day
- 3,000 emails/month
- Unlimited API calls

## 🚀 Production Deployment

### Vercel

1. Add environment variables in Vercel dashboard
2. Set all `NEXT_PUBLIC_*` variables
3. Set server-side variables (`RESEND_API_KEY`)
4. Redeploy application

### Other Platforms

1. Add environment variables in platform dashboard
2. Ensure server-side variables are available to API routes
3. Restart application after adding variables

---

**Status**: ✅ Ready for production use!

