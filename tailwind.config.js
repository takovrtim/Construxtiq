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
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#1a1a1a',
          50: '#f8f7f4',
        },
        orange: {
          DEFAULT: '#d95f2b',
          light: '#fdf0e8',
          dark: '#7a2d0d',
        },
      },
    },
  },
  plugins: [],
}
