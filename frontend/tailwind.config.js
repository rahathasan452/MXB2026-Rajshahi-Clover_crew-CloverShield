/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CloverShield Theme Colors (matching Streamlit app)
        primary: '#00D9FF',
        success: '#00FF88',
        warning: '#FFD700',
        danger: '#FF4444',
        'dark-bg': '#050714',
        'card-bg': '#0F1229',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0AEC0',
        // MFS Brand Colors
        'bkash-pink': '#E2136E',
        'nagad-orange': '#F7921E',
        // Semantic colors
        neutral: '#3B82F6',
        caution: '#F59E0B',
        'high-risk': '#EF4444',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        'hind-siliguri': ['var(--font-hind-siliguri)', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0A0E27 0%, #1a1a2e 100%)',
        'gradient-header': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      },
    },
  },
  plugins: [],
}

