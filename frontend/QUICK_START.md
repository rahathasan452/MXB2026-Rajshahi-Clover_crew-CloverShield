# Frontend Quick Start

Quick reference for setting up and running the CloverShield frontend.

## ✅ Prerequisites

- Node.js 18+ installed
- Supabase project configured (see `../supabase/`)
- ML API deployed (see `../ml-api/`)

## 🚀 Setup in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp env.template .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ML_API_URL=https://your-ml-api.com
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🎨 Features

- ✅ Twin-view layout
- ✅ Transaction simulator
- ✅ Real-time fraud detection
- ✅ Bilingual (EN/BN)
- ✅ Responsive design

## 🔧 Troubleshooting

**Port already in use?**
```bash
# Use different port
PORT=3001 npm run dev
```

**Environment variables not loading?**
- Ensure file is named `.env.local` (not `.env`)
- Restart dev server after changes

**Supabase connection errors?**
- Verify API keys in `.env.local`
- Check Supabase RLS policies
- Ensure Supabase project is active

**ML API errors?**
- Verify ML API URL
- Check ML API is deployed and running
- Review CORS settings

## 📚 Next Steps

1. Deploy to Vercel/Netlify
2. Configure production environment variables
3. Set up monitoring
4. Add analytics

---

**Ready to go!** 🚀

