/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        night: '#0a0a0c',
        ink: '#111114',
        panel: '#17171b',
        panel2: '#1f1f24',
        linec: '#2a2a31',
        accent: {
          DEFAULT: '#6d5df6',
          soft: '#8b7bff',
          dim: '#efeafa',
        },
      },
      borderRadius: {
        xs: '2px',
        sm: '3px',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
        'lift-lg': '0 2px 4px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};