/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        toklink: {
          50: '#edf3fe',
          100: '#dee8fc',
          300: '#86b1ff',
          500: '#3c80ff',
          600: '#2b76ff',
          700: '#003185',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'toklink': '0 18px 50px rgba(0, 49, 133, 0.18)',
      },
    },
  },
  plugins: [],
}
