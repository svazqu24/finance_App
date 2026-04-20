/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nero: {
          bg:      '#0a0e1a',
          surface: '#111827',
          border:  '#1f2937',
          green:   '#27AE60',
          'green-light': '#4ade80',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
