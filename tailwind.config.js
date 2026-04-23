/** @type {import('tailwindcss').Config} */
// Ungig design tokens — dark navy + warm gold, mobile-first.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060f1a',
          900: '#0b1b2b',
          800: '#112a40',
          700: '#173955',
          600: '#1f4a6d',
          500: '#2a6390',
        },
        gold: {
          500: '#d4a85a',
          400: '#e0bd7a',
          300: '#ecd39a',
          200: '#f4e3bd',
        },
        ink: {
          50: '#f7f8fa',
          100: '#e6eaf0',
          300: '#9aa7b7',
          500: '#5d6b7e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(7, 20, 33, 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      maxWidth: {
        app: '28rem', // ~448px mobile-first container
      },
    },
  },
  plugins: [],
};
