/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        givexa: {
          50: '#f5f2ff',
          100: '#eee8ff',
          300: '#b6a5ff',
          500: '#7148ff',
          600: '#6137f4',
          700: '#4f28d3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'givexa': '0 18px 50px rgba(94, 52, 236, 0.24)',
      },
    },
  },
  plugins: [],
}
