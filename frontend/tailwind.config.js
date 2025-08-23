/** @type {import('tailwindcss').Config} */
export default {
  // sin darkMode
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // azul
        accent:  '#fbbf24', // amarillo
      },
      borderRadius: { '2xl': '1rem' },
    },
  },
  plugins: [],
}