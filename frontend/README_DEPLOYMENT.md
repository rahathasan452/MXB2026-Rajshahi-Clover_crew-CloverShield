# Quick Deployment Guide

Fast-track guide to deploy CloverShield to Vercel.

## ⚡ 5-Minute Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repo
4. Vercel auto-detects Next.js

### 3. Add Environment Variables

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_ML_API_URL=https://your-api.com
```

**Optional:**
```
NEXT_PUBLIC_POSTHOG_KEY=your-key
RESEND_API_KEY=your-key
RESEND_FROM_EMAIL=alerts@domain.com
RESEND_TO_EMAIL=security@domain.com
```

### 4. Deploy
Click "Deploy" and wait 2-5 minutes.

### 5. Verify
1. Open deployment URL
2. Run smoke test (see SMOKE_TEST.md)
3. Check all features work

## 📚 Full Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [SMOKE_TEST.md](./SMOKE_TEST.md) - Verification checklist
- [VERCEL_ENV_VARS.md](./VERCEL_ENV_VARS.md) - Environment variables

## ✅ Post-Deployment Checklist

- [ ] Site loads at deployment URL
- [ ] Users load from Supabase
- [ ] ML API responds
- [ ] Transactions process
- [ ] Analytics track events
- [ ] Emails send for alerts

---

**Ready to deploy!** 🚀

