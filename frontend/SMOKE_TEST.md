# Smoke Test Guide

Comprehensive smoke test checklist for verifying CloverShield deployment.

## 🎯 Test Objectives

Verify end-to-end functionality:
1. Frontend loads and displays correctly
2. Supabase connection works
3. ML API integration functions
4. Transactions process correctly
5. Analytics track events
6. Emails send for alerts
7. Database updates persist

## 📋 Pre-Test Checklist

- [ ] Vercel deployment completed
- [ ] All environment variables set
- [ ] Supabase project active
- [ ] ML API deployed and accessible
- [ ] PostHog account configured (optional)
- [ ] Resend account configured (optional)

## 🧪 Test Scenarios

### Test 1: Basic Site Load

**Steps:**
1. Navigate to deployment URL
2. Wait for page to load
3. Check browser console for errors

**Expected Results:**
- ✅ Page loads within 3 seconds
- ✅ Header displays with logo and title
- ✅ No console errors
- ✅ Analytics dashboard visible
- ✅ Language toggle works

**Failure Indicators:**
- ❌ Page doesn't load
- ❌ Console shows errors
- ❌ Blank screen
- ❌ 404 or 500 errors

---

### Test 2: Supabase Connection

**Steps:**
1. Open browser DevTools → Network tab
2. Filter by "supabase"
3. Reload page
4. Check for API calls

**Expected Results:**
- ✅ API calls to Supabase succeed (200 status)
- ✅ Users load in dropdown
- ✅ User profile displays when selected
- ✅ No CORS errors

**Verify in Supabase Dashboard:**
1. Go to Supabase → Table Editor → users
2. Verify users exist
3. Check RLS policies are active

**Failure Indicators:**
- ❌ 401/403 errors (authentication)
- ❌ CORS errors
- ❌ No users in dropdown
- ❌ "Failed to load users" error

---

### Test 3: ML API Integration

**Steps:**
1. Fill transaction form:
   - Select sender
   - Select receiver
   - Enter amount: 5000
   - Select type: TRANSFER
2. Click "Analyze Transaction"
3. Wait for response

**Expected Results:**
- ✅ Loading state appears
- ✅ Prediction returns within 5 seconds
- ✅ Fraud probability displays (0-100%)
- ✅ Decision zone shows result
- ✅ Risk level displays
- ✅ SHAP explanations appear (if available)

**Verify ML API Directly:**
```bash
curl -X POST https://your-ml-api.com/health
# Should return: {"status":"healthy","model_loaded":true}
```

**Failure Indicators:**
- ❌ Timeout errors
- ❌ 500 errors from ML API
- ❌ "Model not loaded" error
- ❌ No prediction displayed

---

### Test 4: Transaction Processing

**Steps:**
1. Complete Test 3 (ML API test)
2. After prediction displays, check Supabase

**Expected Results:**
- ✅ Transaction saved to Supabase
- ✅ Transaction has ML results:
  - `fraud_probability` set
  - `fraud_decision` set (pass/warn/block)
  - `risk_level` set
  - `status` updated
- ✅ Analytics numbers increment
- ✅ UI updates with results

**Verify in Supabase:**
1. Go to Table Editor → transactions
2. Find latest transaction
3. Verify all fields populated

**Failure Indicators:**
- ❌ Transaction not in database
- ❌ Missing ML results
- ❌ Analytics don't update
- ❌ UI doesn't refresh

---

### Test 5: Analytics Tracking

**Steps:**
1. Open browser console
2. Process a transaction
3. Check PostHog dashboard

**Expected Results:**
- ✅ Console shows "PostHog analytics initialized"
- ✅ Events appear in PostHog:
  - `transaction_processed`
  - `transaction_approved/warned/blocked`
  - `ml_api_call`
- ✅ Event properties are correct

**Verify in PostHog:**
1. Go to PostHog dashboard
2. Navigate to Events
3. Filter by event name
4. Verify event properties

**Failure Indicators:**
- ❌ No PostHog initialization message
- ❌ Events not in dashboard
- ❌ Missing event properties
- ❌ PostHog errors in console

---

### Test 6: Email Notifications

**Steps:**
1. Process a HIGH-RISK transaction:
   - Use suspicious user
   - Large amount (>50% of balance)
   - Cash Out type
2. Wait for BLOCK or WARN decision
3. Check email

**Expected Results:**
- ✅ Email sent for BLOCK decision
- ✅ Email sent for WARN decision
- ✅ Email NOT sent for PASS decision
- ✅ Email contains:
  - Transaction details
  - Risk assessment
  - Top risk factors

**Verify:**
1. Check Resend dashboard → Emails
2. Verify email sent
3. Check inbox for email
4. Verify email content

**Failure Indicators:**
- ❌ No email sent
- ❌ Email sent for PASS transactions
- ❌ Email content missing
- ❌ API route errors

---

### Test 7: Real-Time Analytics

**Steps:**
1. Note current analytics numbers
2. Process 3 transactions
3. Verify numbers update
4. Reload page
5. Verify numbers persist

**Expected Results:**
- ✅ "Transactions Processed" increments
- ✅ "Money Saved" updates (if fraud blocked)
- ✅ "Fraud Detected" increments (if blocked)
- ✅ Numbers persist after reload

**Verify in Supabase:**
1. Check `analytics_snapshots` table
2. Verify metrics updated
3. Check latest snapshot

**Failure Indicators:**
- ❌ Numbers don't update
- ❌ Numbers reset on reload
- ❌ Database not updated
- ❌ State management issues

---

### Test 8: Error Handling

**Steps:**
1. Test with invalid data:
   - Same sender/receiver
   - Amount > balance
   - Negative amount
2. Test with ML API down
3. Test with Supabase down

**Expected Results:**
- ✅ Validation errors display
- ✅ Error messages are user-friendly
- ✅ App doesn't crash
- ✅ Error states handled gracefully

**Failure Indicators:**
- ❌ App crashes
- ❌ No error messages
- ❌ Unhandled exceptions
- ❌ Blank error states

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Deployment URL: ___________

Test 1: Basic Site Load
  [ ] Pass  [ ] Fail
  Notes: ___________

Test 2: Supabase Connection
  [ ] Pass  [ ] Fail
  Notes: ___________

Test 3: ML API Integration
  [ ] Pass  [ ] Fail
  Notes: ___________

Test 4: Transaction Processing
  [ ] Pass  [ ] Fail
  Notes: ___________

Test 5: Analytics Tracking
  [ ] Pass  [ ] Fail
  Notes: ___________

Test 6: Email Notifications
  [ ] Pass  [ ] Fail
  Notes: ___________

Test 7: Real-Time Analytics
  [ ] Pass  [ ] Fail
  Notes: ___________

Test 8: Error Handling
  [ ] Pass  [ ] Fail
  Notes: ___________

Overall Status: [ ] PASS  [ ] FAIL
Issues Found: ___________
```

## 🔧 Quick Test Script

### Automated Test (Browser Console)

```javascript
// Run in browser console on deployed site

async function smokeTest() {
  console.log('🧪 Starting Smoke Test...')
  
  // Test 1: Check Supabase
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?limit=1`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })
    console.log('✅ Supabase:', response.ok ? 'Connected' : 'Failed')
  } catch (e) {
    console.error('❌ Supabase:', e.message)
  }
  
  // Test 2: Check ML API
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_ML_API_URL}/health`)
    const data = await response.json()
    console.log('✅ ML API:', data.status === 'healthy' ? 'Healthy' : 'Unhealthy')
  } catch (e) {
    console.error('❌ ML API:', e.message)
  }
  
  // Test 3: Check PostHog
  console.log('✅ PostHog:', window.posthog ? 'Initialized' : 'Not initialized')
  
  console.log('🧪 Smoke Test Complete')
}

smokeTest()
```

## ✅ Success Criteria

All tests must pass for production deployment:

- ✅ Site loads without errors
- ✅ Supabase connection works
- ✅ ML API responds correctly
- ✅ Transactions process end-to-end
- ✅ Analytics track events
- ✅ Emails send for alerts
- ✅ Database updates persist
- ✅ Error handling works

## 🚨 Critical Issues

If any of these fail, **DO NOT** mark as production-ready:

- ❌ Supabase connection fails
- ❌ ML API not responding
- ❌ Transactions not saving
- ❌ Critical errors in console
- ❌ Security vulnerabilities

---

**Run this test after every deployment!** 🧪

