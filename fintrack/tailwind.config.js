/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nero: {
          bg:      '#141414',
          surface: '#1f1f1f',
          border:  '#2a2a2a',
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
