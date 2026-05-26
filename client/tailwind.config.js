/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: '#060609',
          800: '#0a0a0f',
          700: '#11111a',
          600: '#181825',
          DEFAULT: '#09090e',
        },
        cyber: {
          cyan: '#00f2fe',
          purple: '#bc4eff',
          pink: '#ff4e91',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.06)',
          dark: 'rgba(10, 10, 20, 0.45)',
          neon: 'rgba(188, 78, 255, 0.08)',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 242, 254, 0.25)',
        'neon-purple': '0 0 15px rgba(188, 78, 255, 0.25)',
        'neon-pink': '0 0 15px rgba(255, 78, 145, 0.25)',
        'glass-glow': 'inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'glow-pulse-cyan': 'glowPulseCyan 3s infinite alternate',
        'glow-pulse-purple': 'glowPulsePurple 3s infinite alternate',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'pulse-fast': 'pulseFast 1s infinite alternate',
      },
      keyframes: {
        glowPulseCyan: {
          '0%': { boxShadow: '0 0 5px rgba(0, 242, 254, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 242, 254, 0.5)' },
        },
        glowPulsePurple: {
          '0%': { boxShadow: '0 0 5px rgba(188, 78, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(188, 78, 255, 0.5)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseFast: {
          '0%': { opacity: '0.4', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
