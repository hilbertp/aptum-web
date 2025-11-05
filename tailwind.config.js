/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#222222',
        muted: '#666666',
        line: '#e5e5e5',
        panel: '#fafafa',
        aptum: {
          blue: '#0b65c2'
        }
      }
    }
  },
  plugins: []
};
