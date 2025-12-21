# Deployment Checklist

Quick checklist for deploying CloverShield to production.

## 📋 Pre-Deployment

### Code Preparation
- [ ] All code committed to GitHub
- [ ] No console errors in development
- [ ] Build succeeds locally: `npm run build`
- [ ] All tests pass (if applicable)
- [ ] Environment variables documented

### Service Configuration
- [ ] Supabase project created and configured
- [ ] Supabase migrations run (tables created)
- [ ] Supabase RLS policies configured
- [ ] ML API deployed and accessible
- [ ] PostHog account created (optional)
- [ ] Resend account created (optional)

## 🚀 Deployment Steps

### Vercel Setup
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Project imported to Vercel
- [ ] Build settings verified (Next.js auto-detected)

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` added
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added
- [ ] `NEXT_PUBLIC_ML_API_URL` added
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` added (optional)
- [ ] `RESEND_API_KEY` added (optional)
- [ ] `RESEND_FROM_EMAIL` added (optional)
- [ ] `RESEND_TO_EMAIL` added (optional)
- [ ] All variables set for Production environment
- [ ] All variables set for Preview environment

### Initial Deployment
- [ ] First deployment triggered
- [ ] Build completes successfully
- [ ] Deployment URL obtained
- [ ] Site loads at deployment URL

## ✅ Post-Deployment Verification

### Basic Checks
- [ ] Site loads without errors
- [ ] No 404 or 500 errors
- [ ] Console shows no critical errors
- [ ] Page renders correctly
- [ ] Responsive design works

### Supabase Integration
- [ ] Users load from database
- [ ] User dropdown populated
- [ ] User profile displays
- [ ] No Supabase connection errors
- [ ] RLS policies working

### ML API Integration
- [ ] ML API health check passes
- [ ] Predictions return successfully
- [ ] Fraud probability displays
- [ ] Decision zone shows results
- [ ] SHAP explanations appear
- [ ] Response time acceptable (<5s)

### Transaction Processing
- [ ] Transaction form validates
- [ ] Transactions save to database
- [ ] ML results stored correctly
- [ ] Transaction status updates
- [ ] Analytics numbers increment
- [ ] UI updates with results

### Analytics
- [ ] PostHog initializes (check console)
- [ ] Events tracked on transactions
- [ ] Events appear in PostHog dashboard
- [ ] Page views tracked
- [ ] No analytics errors

### Email Notifications
- [ ] Email sent for BLOCK transactions
- [ ] Email sent for WARN transactions
- [ ] Email NOT sent for PASS transactions
- [ ] Email content is correct
- [ ] Emails received successfully

### Real-Time Features
- [ ] Analytics update in real-time
- [ ] "Money Saved" increments
- [ ] "Transactions Processed" increments
- [ ] "Fraud Detected" increments
- [ ] Data persists after reload

## 🔒 Security Verification

- [ ] Environment variables not exposed in client
- [ ] API keys not in source code
- [ ] HTTPS enabled (Vercel default)
- [ ] CORS properly configured
- [ ] Supabase RLS policies active
- [ ] No sensitive data in console logs

## 📊 Performance Checks

- [ ] Page load time < 3 seconds
- [ ] ML API response < 5 seconds
- [ ] No memory leaks
- [ ] Images optimized
- [ ] Code splitting working

## 🧪 Smoke Test Results

Run full smoke test (see SMOKE_TEST.md):

- [ ] Test 1: Basic Site Load - PASS
- [ ] Test 2: Supabase Connection - PASS
- [ ] Test 3: ML API Integration - PASS
- [ ] Test 4: Transaction Processing - PASS
- [ ] Test 5: Analytics Tracking - PASS
- [ ] Test 6: Email Notifications - PASS
- [ ] Test 7: Real-Time Analytics - PASS
- [ ] Test 8: Error Handling - PASS

## 📝 Documentation

- [ ] Deployment URL documented
- [ ] Environment variables documented
- [ ] Team notified of deployment
- [ ] Monitoring set up
- [ ] Backup strategy in place

## 🎯 Final Sign-Off

- [ ] All critical tests pass
- [ ] No blocking issues
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Team approval obtained

**Deployment Status:** [ ] APPROVED  [ ] NEEDS FIXES

**Deployment URL:** _________________________

**Deployed By:** _________________________

**Date:** _________________________

---

**Ready for production!** 🚀

