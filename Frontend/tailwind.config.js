/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],

  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        paper: '#FBF8F3',
        ink: '#1E2A38',
        indigo: {
          50:  '#EEF2F8',
          100: '#D7E0EE',
          200: '#B8C9E0',
          300: '#8AA3C4',
          400: '#3E5C8A',
          500: '#2D4A75',
          600: '#233A66',
          700: '#1A2C50',
          800: '#142240',
          900: '#0F1B30',
        },
        marigold: {
          50:  '#FDF1E0',
          100: '#FBE3BF',
          200: '#F7C88A',
          300: '#F3AD55',
          400: '#F0A23E',
          500: '#E98A15',
          600: '#C56F05',
          700: '#9A5604',
        },
        navy: {
          950: '#060E1C',
          900: '#0D1629',
          800: '#0F1B30',
          700: '#1A2C50',
          600: '#233A66',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', '"Noto Sans Devanagari"', '"Noto Sans Telugu"', 'sans-serif'],
        body:    ['Inter', '"Noto Sans Devanagari"', '"Noto Sans Telugu"', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card:       '0 12px 40px -12px rgba(15,27,48,0.18)',
        'card-lg':  '0 20px 60px -16px rgba(15,27,48,0.28)',
        'glow-gold':   '0 6px 30px rgba(233,138,21,0.45)',
        'glow-indigo': '0 6px 30px rgba(26,44,80,0.4)',
        'inner-top':   'inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg,#060E1C 0%,#0F1B30 30%,#1A2C50 70%,#233A66 100%)',
        'gold-gradient': 'linear-gradient(135deg,#E98A15,#F0A23E)',
        'card-gradient': 'linear-gradient(160deg,#ffffff 0%,#F8FAFF 100%)',
      },
    },
  },
  plugins: [],
};
