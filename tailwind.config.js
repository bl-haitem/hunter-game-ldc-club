/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hunter: {
          dark: '#090a0f',
          darker: '#050608',
          card: '#121420',
          cardBorder: '#1e2238',
          neon: '#00ff88',
          neonHover: '#00cc6a',
          gold: '#ffd700',
          goldDark: '#c99a00',
          cyan: '#00e5ff',
          purple: '#bd00ff',
          red: '#ff3366',
          muted: '#8e96b0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'nen-green': '0 0 25px rgba(0, 255, 136, 0.45), 0 0 50px rgba(0, 255, 136, 0.2)',
        'nen-gold': '0 0 25px rgba(255, 215, 0, 0.45), 0 0 50px rgba(255, 215, 0, 0.2)',
        'nen-cyan': '0 0 25px rgba(0, 229, 255, 0.45), 0 0 50px rgba(0, 229, 255, 0.2)',
        'nen-purple': '0 0 25px rgba(189, 0, 255, 0.45), 0 0 50px rgba(189, 0, 255, 0.2)',
        'card-glow': '0 10px 30px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      keyframes: {
        pulseAura: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1', filter: 'drop-shadow(0 0 15px rgba(0, 255, 136, 0.8))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        'aura': 'pulseAura 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      }
    },
  },
  plugins: [],
}
