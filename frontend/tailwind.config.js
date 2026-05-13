/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  safelist: [
    {
      pattern: /(bg|text|border|shadow)-(red|blue|green|yellow|orange|violet|purple|sky|amber)-(100|400|500|600)/,
      variants: ['hover', 'focus', 'active']
    },
    {
      pattern: /bg-(red|blue|green|yellow|orange|violet|purple|sky|amber)-500\/(10|20|30|5)/
    }
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
          border: 'rgba(255, 255, 255, 0.2)'
        },
        primary: {
          500: '#3b82f6',
          700: '#1d4ed8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
