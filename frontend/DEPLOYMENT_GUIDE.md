# CloverShield Deployment Guide

Complete guide for deploying the Next.js frontend to Vercel and verifying end-to-end functionality.

## 🚀 Vercel Deployment

### Prerequisites

- GitHub repository with frontend code
- Vercel account (free tier available)
- Supabase project configured
- ML API deployed and accessible
- PostHog account (optional, for analytics)
- Resend account (optional, for emails)

### Step 1: Prepare GitHub Repository

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CloverShield frontend"
   git branch -M main
   git remote add origin https://github.com/your-username/clovershield-frontend.git
   git push -u origin main
   ```

2. **Verify repository structure:**
   - `package.json` exists
   - `next.config.js` exists
   - `.env.example` or `env.template` exists
   - All components and pages are present

### Step 2: Connect to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in** with GitHub
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. **Select the repository** containing the frontend code

### Step 3: Configure Build Settings

Vercel should auto-detect Next.js, but verify:

- **Framework Preset:** Next.js
- **Root Directory:** `frontend` (if frontend is in a subdirectory) or `.` (if root)
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

### Step 4: Supabase Auth (Optional)

**Note:** The current implementation uses public access with RLS policies. If you need user authentication:

1. Enable Supabase Auth in your project
2. Configure auth providers (Email, OAuth, etc.)
3. Use the auth functions in `lib/auth.ts`
4. Update RLS policies to use `auth.uid()`

For now, the app works without authentication for demo purposes.

### Step 5: Set Environment Variables

**Critical:** Set these in Vercel dashboard before first deployment.

#### Required Variables

1. **Supabase Configuration:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **ML API Configuration:**
   ```
   NEXT_PUBLIC_ML_API_URL=https://your-ml-api.onrender.com
   ```

#### Optional Variables

3. **PostHog Analytics:**
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

4. **Resend Email:**
   ```
   RESEND_API_KEY=re_your_key_here
   RESEND_FROM_EMAIL=alerts@yourdomain.com
   RESEND_TO_EMAIL=security@yourdomain.com
   ```

#### How to Add in Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Click **Add New**
3. Enter variable name and value
4. Select environments: **Production**, **Preview**, **Development**
5. Click **Save**
6. **Redeploy** after adding variables

### Step 6: Deploy

1. **Click "Deploy"** in Vercel dashboard
2. **Wait for build** (2-5 minutes)
3. **Get deployment URL:** `https://your-project.vercel.app`

### Step 7: Configure Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your domain (e.g., `clovershield.com`)
3. Add DNS records as instructed
4. Wait for DNS propagation

## ✅ Smoke Test Checklist

### Pre-Deployment Verification

- [ ] All environment variables set in Vercel
- [ ] Supabase project is active
- [ ] ML API is deployed and accessible
- [ ] GitHub repository is connected
- [ ] Build completes successfully

### Post-Deployment Verification

#### 1. Basic Functionality

- [ ] Site loads at deployment URL
- [ ] No console errors in browser
- [ ] Header displays correctly
- [ ] Language toggle works
- [ ] Analytics dashboard displays

#### 2. Supabase Connection

- [ ] Users load from Supabase
- [ ] User profile cards display
- [ ] Transaction history accessible
- [ ] Database queries work

**Test:**
1. Open browser console
2. Check for Supabase connection errors
3. Verify users appear in dropdown
4. Select a user and verify profile displays

#### 3. ML API Integration

- [ ] ML API endpoint is accessible
- [ ] Predictions are returned
- [ ] Fraud probability displays
- [ ] Decision zone shows results
- [ ] SHAP explanations appear

**Test:**
1. Fill transaction form
2. Click "Analyze Transaction"
3. Verify loading state
4. Check prediction results appear
5. Verify fraud probability gauge displays

#### 4. Transaction Processing

- [ ] Transaction form validates correctly
- [ ] Transaction creates in Supabase
- [ ] ML prediction is stored
- [ ] Analytics update
- [ ] UI updates with results

**Test:**
1. Select sender and receiver
2. Enter amount
3. Submit transaction
4. Check Supabase dashboard for new transaction
5. Verify transaction has ML results

#### 5. Analytics Tracking

- [ ] PostHog initializes (check console)
- [ ] Events tracked on transaction
- [ ] Events appear in PostHog dashboard

**Test:**
1. Open browser console
2. Look for "PostHog analytics initialized"
3. Process a transaction
4. Check PostHog dashboard for events

#### 6. Email Notifications

- [ ] Email sent for BLOCK transactions
- [ ] Email sent for WARN transactions
- [ ] Email not sent for PASS transactions
- [ ] Email content is correct

**Test:**
1. Process high-risk transaction (BLOCK)
2. Check Resend dashboard for sent email
3. Verify email received
4. Check email content

#### 7. Real-Time Analytics

- [ ] "Money Saved" updates
- [ ] "Transactions Processed" increments
- [ ] "Fraud Detected" increments
- [ ] Analytics persist across page reloads

**Test:**
1. Process multiple transactions
2. Verify analytics numbers update
3. Reload page
4. Verify analytics persist (from Supabase)

## 🔍 Detailed Verification Steps

### Step 1: Verify Supabase Connection

```bash
# In browser console on deployed site
# Check network tab for Supabase API calls
# Should see requests to: https://xxxxx.supabase.co/rest/v1/users
```

**Expected:**
- 200 status codes
- User data returned
- No CORS errors

### Step 2: Verify ML API Connection

```bash
# Test ML API directly
curl -X POST https://your-ml-api.com/health

# Expected response:
# {"status":"healthy","model_loaded":true,...}
```

**In Browser:**
- Open Network tab
- Process transaction
- Look for request to ML API
- Verify response contains prediction

### Step 3: Verify Database Updates

1. **Process a transaction**
2. **Go to Supabase Dashboard** → **Table Editor** → **transactions**
3. **Verify:**
   - New transaction record exists
   - `fraud_probability` is set
   - `fraud_decision` is set
   - `risk_level` is set
   - `status` is correct

### Step 4: Verify Analytics Updates

1. **Process a transaction**
2. **Check analytics dashboard** on frontend
3. **Verify numbers increment**
4. **Check Supabase** → **analytics_snapshots** table
5. **Verify metrics updated**

## 🐛 Troubleshooting

### Build Fails

**Issue:** Build error in Vercel

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify all dependencies in `package.json`
3. Check TypeScript errors locally: `npm run build`
4. Verify Node.js version (Vercel uses 18.x by default)

### Environment Variables Not Working

**Issue:** Variables not accessible in app

**Solutions:**
1. Verify variable names match exactly (case-sensitive)
2. Ensure `NEXT_PUBLIC_` prefix for client-side variables
3. Redeploy after adding variables
4. Check Vercel logs for variable access

### Supabase Connection Errors

**Issue:** Cannot connect to Supabase

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Check Supabase RLS policies allow access
4. Verify Supabase project is active
5. Check CORS settings in Supabase

### ML API Connection Errors

**Issue:** ML API not responding

**Solutions:**
1. Verify `NEXT_PUBLIC_ML_API_URL` is correct
2. Test ML API directly: `curl https://your-api.com/health`
3. Check ML API CORS settings
4. Verify ML API is deployed and running
5. Check network tab for error details

### Analytics Not Tracking

**Issue:** PostHog events not appearing

**Solutions:**
1. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set
2. Check browser console for PostHog errors
3. Verify PostHog project is active
4. Check PostHog dashboard filters
5. Test with PostHog debug mode

### Emails Not Sending

**Issue:** No emails received

**Solutions:**
1. Verify `RESEND_API_KEY` is set (server-side)
2. Check Resend dashboard for sent emails
3. Verify email addresses are valid
4. Check Resend API rate limits
5. Review Vercel function logs

## 📊 Monitoring

### Vercel Analytics

- Go to **Analytics** tab in Vercel dashboard
- View page views, performance metrics
- Monitor error rates

### PostHog Dashboard

- View user sessions
- Track transaction events
- Create custom insights
- Set up alerts

### Supabase Dashboard

- Monitor database usage
- View transaction records
- Check API request logs
- Monitor performance

## 🔒 Security Checklist

- [ ] Environment variables are set (not hardcoded)
- [ ] API keys are not exposed in client-side code
- [ ] Supabase RLS policies are configured
- [ ] ML API has authentication (if needed)
- [ ] HTTPS is enabled (Vercel default)
- [ ] CORS is properly configured
- [ ] Rate limiting is in place (if needed)

## 📈 Performance Optimization

### Vercel Optimizations

- **Automatic:** Image optimization, code splitting
- **Manual:** Configure caching headers
- **Monitor:** Use Vercel Analytics

### Database Optimization

- **Indexes:** Ensure Supabase indexes are created
- **Queries:** Optimize database queries
- **Caching:** Use Supabase caching where possible

### ML API Optimization

- **Caching:** Cache predictions for similar transactions
- **Batching:** Use batch endpoint for multiple transactions
- **Monitoring:** Track API response times

## ✅ Final Verification

### End-to-End Test

1. **Open deployed site:** `https://your-project.vercel.app`
2. **Select a user** from dropdown
3. **Fill transaction form:**
   - Sender: Select user
   - Receiver: Select different user
   - Amount: Enter amount
   - Type: Select type
4. **Click "Analyze Transaction"**
5. **Verify:**
   - Loading state appears
   - Prediction results display
   - Decision zone shows decision
   - Risk drivers appear
   - Analytics update
   - Transaction saved to Supabase
   - Email sent (if BLOCK/WARN)
   - Event tracked in PostHog

### Success Criteria

- ✅ Site loads without errors
- ✅ Users load from Supabase
- ✅ ML API responds with predictions
- ✅ Transactions save to database
- ✅ Analytics update in real-time
- ✅ Emails sent for flagged transactions
- ✅ Events tracked in PostHog
- ✅ All features functional

## 🚀 Production URL

After successful deployment, your site will be available at:

```
https://your-project.vercel.app
```

Or with custom domain:

```
https://clovershield.com
```

---

**Status**: Ready for deployment! 🚀

