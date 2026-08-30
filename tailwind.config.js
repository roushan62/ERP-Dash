/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
          500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
        },
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideIn: { '0%': { opacity: 0, transform: 'translateX(24px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
      },
      animation: {
        fadeUp: 'fadeUp .3s ease both',
        fadeIn: 'fadeIn .2s ease both',
        slideIn: 'slideIn .25s ease both',
      },
    },
  },
  plugins: [],
}
