/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        player:  '#2563eb',
        empire1: '#e1071a',
        empire2: '#1a56db',
        empire3: '#166534',
        empire4: '#ca8a04',
        primary: '#1e3a5f',
        accent:  '#e07b1a',
        surface: '#f8f7f2',
      },
      fontFamily: {
        game: ['Georgia', 'serif'],
        ui:   ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
