/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', foreground: '#ffffff' },
        secondary: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
        background: '#ffffff',
        foreground: '#0f172a',
        muted: { DEFAULT: '#f8fafc', foreground: '#64748b' },
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#2563eb',
        destructive: { DEFAULT: '#ef4444', foreground: '#ffffff' },
        card: { DEFAULT: '#ffffff', foreground: '#0f172a' },
        accent: { DEFAULT: '#f1f5f9', foreground: '#0f172a' }
      }
    },
  },
  plugins: [],
}
