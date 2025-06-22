/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'depth-0': '#10b981', // green
        'depth-1': '#3b82f6', // blue
        'depth-2': '#f59e0b', // yellow
        'depth-3': '#ec4899', // magenta
        'depth-4': '#06b6d4', // cyan
        'depth-5': '#ef4444', // red
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}