/** @type {import('tailwindcss').Config} */
// Ungig brand palette — Escape the 9 to 5.
//   Jet Black     #0D0D0F — primary background
//   Charcoal      #1B1C20 — card backgrounds
//   Steel Gray    #444F5A — borders, secondary elements
//   Silver        #D5D7DC — body text
//   Lilac Accent  #A7A1BC — subtle accents and highlights
//
// Typography:
//   Anton (condensed, all caps) — headings
//   Montserrat — body
//
// Legacy tokens (navy/gold/ink) remain aliased to the new palette so existing
// component classes adopt the rebrand automatically. Prefer the semantic
// tokens (jet/charcoal/steel/silver/lilac) for any new code.

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand tokens (preferred)
        jet: '#0D0D0F',
        charcoal: '#1B1C20',
        steel: {
          DEFAULT: '#444F5A',
          700: '#2A333B',
          600: '#36414B',
          500: '#444F5A',
          400: '#5D6B78',
          300: '#7C8794',
        },
        silver: {
          DEFAULT: '#D5D7DC',
          400: '#B5B8BF',
          300: '#8A9099',
        },
        lilac: {
          DEFAULT: '#A7A1BC',
          400: '#A7A1BC',
          300: '#BEB8D0',
          200: '#D5CFE3',
        },

        // Legacy aliases — map old token scale to the new brand palette.
        navy: {
          950: '#0D0D0F', // jet
          900: '#1B1C20', // charcoal
          800: '#1B1C20', // charcoal
          700: '#2A333B', // steel-700
          600: '#444F5A', // steel
          500: '#5D6B78',
        },
        gold: {
          500: '#A7A1BC', // lilac
          400: '#A7A1BC',
          300: '#BEB8D0',
          200: '#D5CFE3',
        },
        ink: {
          50: '#FFFFFF',
          100: '#D5D7DC', // silver
          300: '#8A9099',
          500: '#5D6B7E',
        },
      },
      fontFamily: {
        // Montserrat drives all body copy per brand guide.
        sans: ['"Montserrat"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Anton is the brand's condensed display face (all caps in use).
        display: ['"Anton"', 'Impact', '"Arial Narrow"', 'sans-serif'],
      },
      letterSpacing: {
        brand: '0.04em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0, 0, 0, 0.45)',
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
