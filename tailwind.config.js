/** @type {import('tailwindcss').Config} */
//
// Gifted brand palette — give. receive. grow.
// Light-mode throughout. Cream/green/navy with warm accents and a frog mascot.
//
// Semantic tokens (preferred):
//   bg          #F9F8F5   page background
//   surface     #FFFFFF   card background
//   cream       #F6EFE4   accent surface
//   border      #ECEAE4   hairlines
//   ink.*       primary/secondary/muted/inverse text
//   navyHero    #0F1331   hero card background (matches ink.primary)
//   green       #1B7F4F   primary CTA
//   sage        #A7C7A1   soft accent / success ring
//   gold        #E0B75A   warm accent / badge highlight
//   coral       #E96D5A   alert / destructive / FAB halo
//   lavender    #D7D9E6   neutral chip background, subtle dividers
//
// Typography:
//   Manrope         body, UI, and headings
//   Fraunces Italic Wordmark only (font-wordmark)
//
// Legacy aliases (navy/gold/ink/jet/charcoal/steel/silver/lilac) remap into
// the new palette so existing components render sensibly until each file is
// swept to the semantic tokens.

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Semantic Gifted tokens ────────────────────────────────────────
        bg: '#F9F8F5',
        surface: '#FFFFFF',
        cream: '#F6EFE4',
        border: '#ECEAE4',
        navyHero: '#0F1331',
        ink: {
          primary: '#0F1331',
          secondary: '#2A2D3A',
          muted: '#A0A4B0',
          inverse: '#F9F8F5',
          // Legacy keys (existing components reference these). Mapped onto
          // the new ink scale so colour intent survives the rebrand.
          50: '#0F1331',  // ex-"darkest"; now primary text
          100: '#2A2D3A', // secondary text
          300: '#A0A4B0', // muted text
          500: '#A0A4B0',
        },
        green: {
          DEFAULT: '#1B7F4F',
          50:  '#E8F3EE',
          100: '#C9E3D4',
          200: '#9BCDB0',
          300: '#6CB68C',
          400: '#3F9B68',
          500: '#1B7F4F',
          600: '#16683F',
          700: '#0F4E2F',
        },
        sage: {
          DEFAULT: '#A7C7A1',
          200: '#D2E2CD',
          300: '#BFD5BB',
          400: '#A7C7A1',
          500: '#8FB48A',
        },
        gold: {
          // Brand gold replaces the previous gold scale wholesale.
          DEFAULT: '#E0B75A',
          200: '#F2DDA8',
          300: '#EBCC81',
          400: '#E0B75A',
          500: '#E0B75A',
          600: '#C39942',
        },
        coral: {
          DEFAULT: '#E96D5A',
          400: '#E96D5A',
          500: '#E96D5A',
          600: '#CB553F',
        },
        lavender: {
          DEFAULT: '#D7D9E6',
          200: '#EAEBF1',
          300: '#E0E2EC',
          400: '#D7D9E6',
        },

        // ── Legacy aliases (Ungig palette → Gifted palette) ───────────────
        // navy: previously the dark backgrounds; now light surfaces.
        navy: {
          950: '#F9F8F5', // page bg
          900: '#FFFFFF', // card bg
          800: '#ECEAE4', // hairlines
          700: '#ECEAE4',
          600: '#D7D9E6',
          500: '#A0A4B0',
        },
        // lilac: previously the accent; map to a sage tone for soft accents.
        lilac: {
          200: '#D2E2CD',
          300: '#BFD5BB',
          400: '#A7C7A1',
          500: '#A7C7A1',
        },
        // Single-token legacy aliases.
        jet: '#F9F8F5',
        charcoal: '#FFFFFF',
        steel: {
          DEFAULT: '#ECEAE4',
          700: '#ECEAE4',
          600: '#D7D9E6',
          500: '#A0A4B0',
          400: '#A0A4B0',
          300: '#2A2D3A',
        },
        silver: {
          DEFAULT: '#2A2D3A',
          400: '#A0A4B0',
          300: '#A0A4B0',
        },
      },

      fontFamily: {
        sans: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        wordmark: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },

      letterSpacing: {
        // No more exaggerated brand tracking — Manrope reads warm at default.
        brand: '0.02em',
        wordmark: '-0.01em',
      },

      boxShadow: {
        card: '0 1px 2px rgba(15, 19, 49, 0.04), 0 8px 24px rgba(15, 19, 49, 0.06)',
        fab:  '0 8px 24px rgba(27, 127, 79, 0.35)',
      },

      borderRadius: {
        card: '1.125rem', // 18px – brand spec for cards (16–20px range)
        xl2:  '1.25rem',  // legacy alias preserved for components using it
      },

      maxWidth: {
        app: '28rem', // ~448px mobile-first container
      },
    },
  },
  plugins: [],
};
