# CloverShield Frontend

Next.js/React frontend replacing the Streamlit UI. Built with modern web standards and connected to Supabase and ML API.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase project (see `supabase/` directory)
- ML API deployed (see `ml-api/` directory)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Run development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open browser:**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page (Transaction Simulator + Guardian)
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── UserProfileCard.tsx
│   ├── TransactionForm.tsx
│   ├── FraudGauge.tsx
│   ├── DecisionZone.tsx
│   ├── AnalyticsDashboard.tsx
│   ├── RiskDrivers.tsx
│   └── LanguageToggle.tsx
├── lib/                   # Utilities
│   ├── supabase.ts       # Supabase client
│   └── ml-api.ts         # ML API client
├── store/                # State management
│   └── useAppStore.ts    # Zustand store
└── public/               # Static assets
```

## 🎨 Components

### UserProfileCard
Displays user account information with balance, verification status, and risk level.

### TransactionForm
Complete transaction input form with validation, amount presets, and recent receivers.

### FraudGauge
Visual gauge chart showing fraud probability (0-100%).

### DecisionZone
Unified decision card displaying fraud probability, decision, and risk level.

### AnalyticsDashboard
Real-time analytics metrics (money saved, transactions processed, etc.).

### RiskDrivers
Human-readable SHAP explanations showing top risk factors.

## 🔌 Integrations

### Supabase
- User data fetching
- Transaction history
- Transaction creation/updates
- Analyst actions

### ML API
- Fraud prediction
- SHAP explanations
- LLM explanations (optional)

## 🌐 Features

- ✅ Twin-view layout (Transaction Simulator + Guardian Command Center)
- ✅ Bilingual support (English/Bangla)
- ✅ Real-time fraud detection
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark theme matching legacy design
- ✅ State management with Zustand
- ✅ Error handling and loading states
- ✅ Toast notifications

## 🎨 Design

Matches the legacy Streamlit design:
- Dark theme (`#0A0E27` background)
- Semantic colors (success, warning, danger)
- Gradient headers
- Card-based layout
- Smooth animations

## 📱 Responsive Breakpoints

- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (stacked layout)
- Desktop: > 1024px (twin-view side-by-side)

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ML_API_URL=https://your-ml-api.com
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

- **Netlify**: Similar to Vercel
- **Railway**: Use Docker or direct Node.js
- **AWS Amplify**: Full-stack deployment

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### Supabase Connection Issues
- Verify environment variables
- Check Supabase RLS policies
- Ensure API keys are correct

### ML API Connection Issues
- Verify ML API URL
- Check CORS settings
- Ensure API is deployed and running

### Build Errors
- Clear `.next` directory
- Delete `node_modules` and reinstall
- Check TypeScript errors

## ✅ Status

- [x] Next.js project setup
- [x] Component structure
- [x] Supabase integration
- [x] ML API integration
- [x] State management
- [x] Responsive design
- [x] Bilingual support
- [ ] Unit tests
- [ ] E2E tests

---

**Ready for deployment!** 🚀

