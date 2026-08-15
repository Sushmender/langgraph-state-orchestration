/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          400: '#9c1a37',
          500: '#7a1128',
          600: '#5e0d1f',
        },
        surface: {
          900: '#121212',
          800: '#1c1414',
          700: '#231a1a',
          600: '#2e1f1f',
          500: '#3a2626',
          400: '#4a3030',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 10px #7a112866, 0 0 20px #7a112833' },
          to:   { boxShadow: '0 0 20px #7a1128aa, 0 0 40px #7a112866' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
