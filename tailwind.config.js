/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#0f1117',
          card: '#1a1d27',
          elevated: '#22253a',
          border: '#2a2d3a',
        },
        accent: {
          DEFAULT: '#6366f1',
          glow: 'rgba(99,102,241,0.35)',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-ring': 'pulse-ring 1.2s cubic-bezier(0.215,0.61,0.355,1) both',
        'fade-in-up': 'fade-in-up 0.2s ease-out both',
        'spin-slow': 'spin 1.5s linear infinite',
        'check-pop': 'check-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px,0,0)' },
          '20%, 80%': { transform: 'translate3d(2px,0,0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px,0,0)' },
          '40%, 60%': { transform: 'translate3d(4px,0,0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '80%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
