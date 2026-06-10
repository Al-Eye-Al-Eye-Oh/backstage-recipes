/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          500: '#4f6ef7',
          600: '#3b56e8',
          700: '#2d44c9',
        },
        surface: {
          900: '#0f0f1a',
          800: '#1a1a2e',
          700: '#252540',
          600: '#32324f',
        }
      }
    }
  },
  plugins: []
}
