# 🔧 Critical Fix: Vercel Root Directory Configuration

## 🚨 The Problem

The build is failing because Vercel is trying to build from the **repository root** instead of the **`frontend`** directory. This causes path resolution to fail.

## ✅ Solution: Set Root Directory in Vercel

### Step 1: Go to Vercel Dashboard
1. Open [vercel.com](https://vercel.com)
2. Sign in
3. Select your project: **MXB2026-Rajshahi-Clover_crew-CloverShield**

### Step 2: Configure Root Directory
1. Click **Settings** (gear icon)
2. Click **General** tab
3. Scroll down to **Root Directory**
4. Click **Edit**
5. Enter: `frontend`
6. Click **Save**

### Step 3: Verify Build Settings
After setting root directory, verify:
- **Framework Preset:** Next.js ✅
- **Root Directory:** `frontend` ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅
- **Install Command:** `npm install` ✅

### Step 4: Commit and Push Changes
Make sure you've committed the updated `next.config.js` and `tsconfig.json`:

```bash
git add frontend/next.config.js frontend/tsconfig.json
git commit -m "Fix path alias resolution for Vercel"
git push origin main
```

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or wait for automatic deployment after push

## 🔍 Why This Fixes It

When root directory is set to `frontend`:
- Vercel runs `npm install` in `frontend/` directory
- Vercel runs `npm run build` in `frontend/` directory
- `__dirname` in `next.config.js` points to `frontend/` directory
- Path aliases resolve correctly: `@/lib/*` → `frontend/lib/*`

Without root directory set:
- Vercel runs commands from repository root
- `__dirname` points to root, not `frontend/`
- Paths can't resolve: `@/lib/*` tries to find `lib/` in root (doesn't exist)

## ✅ Verification Checklist

- [ ] Root Directory set to `frontend` in Vercel Settings
- [ ] `next.config.js` has webpack alias configuration
- [ ] `tsconfig.json` has `baseUrl` and `paths` configured
- [ ] Changes committed and pushed to GitHub
- [ ] Deployment triggered (manual or automatic)
- [ ] Build completes without module resolution errors

## 🐛 If Still Failing

1. **Double-check root directory:** Must be exactly `frontend` (lowercase, no trailing slash)
2. **Clear Vercel cache:** Settings → General → Clear Build Cache
3. **Check build logs:** Look for where it's running commands from
4. **Verify file structure:** Ensure `frontend/lib/`, `frontend/components/` exist

---

**This is the most common cause of this error!** Setting the root directory correctly should fix it. 🚀

