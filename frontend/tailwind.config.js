/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        heading: ['Barlow Condensed', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#050505',
        foreground: '#fafafa',
        card: '#121212',
        border: '#27272a',
        primary: '#22c55e',
        'primary-foreground': '#050505',
        muted: '#242424',
        'muted-foreground': '#94a3b8',
        destructive: '#ef4444',
      },
    },
  },
  plugins: [],
}
