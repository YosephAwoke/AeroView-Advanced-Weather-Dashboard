/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        themeBg: 'var(--bg-gradient)',
        cardBg: 'var(--card-bg)',
        cardBorder: 'var(--card-border)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        glowColor: 'var(--glow-color)',
        accent: 'var(--accent)',
        badgeBg: 'var(--badge-bg)',
      },
      boxShadow: {
        'glow': '0 0 20px 2px var(--glow-color)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'lightning': 'lightning 0.15s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-8px) scale(1.02)' },
        },
        lightning: {
          '0%, 100%': { opacity: 0 },
          '10%, 90%': { opacity: 0.95 },
          '50%': { opacity: 0.3 },
        }
      }
    },
  },
  plugins: [],
}
