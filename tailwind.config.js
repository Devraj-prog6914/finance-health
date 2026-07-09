/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            50: '#eefcf6',
            100: '#d4f7e6',
            200: '#aef0d1',
            300: '#76e4b2',
            400: '#3cd190',
            500: '#0B6E4F', // Core forest green
            600: '#0e8b63',
            700: '#0c7051',
            800: '#0d5942',
            900: '#0c4937',
            950: '#05291f',
          },
          saffron: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdbb74',
            400: '#f97316',
            500: '#F26522', // Saffron orange accent
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
