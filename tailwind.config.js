/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#06080d',
          900: '#0b0e14',
          800: '#111722',
          700: '#1b2333',
          600: '#28344d',
        },
        trade: {
          buy: '#00F59B',
          buyHover: '#00D687',
          sell: '#FF3B69',
          sellHover: '#E02D56',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}