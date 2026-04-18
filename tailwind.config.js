/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fdf4f7',
          100: '#fce4ec',
          200: '#fbc4d6',
          300: '#f79ebf',
          400: '#f36da3',
          500: '#ee458a',
          600: '#e02c74',
          700: '#c41f62',
          800: '#a11c52',
          900: '#821c45',
        },
      },
    },
  },
  plugins: [],
}