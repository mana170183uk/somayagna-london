import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  '#FFF6EC',
          100: '#FFE8CC',
          200: '#FFD199',
          300: '#FFB85C',
          400: '#FB9A2C',
          500: '#E97B11',
          600: '#C25E07',
          700: '#9A480A',
          800: '#7A380D',
          900: '#5B2A0B'
        },
        maroon: {
          50:  '#FBEEEE',
          100: '#F2D1D1',
          200: '#E29C9C',
          300: '#C76A6A',
          400: '#A94343',
          500: '#8B2727',
          600: '#6E1A1A',
          700: '#561414',
          800: '#400F0F',
          900: '#2C0A0A'
        },
        gold: {
          100: '#F8EBC4',
          200: '#EFD68C',
          300: '#E2BB58',
          400: '#CFA13B',
          500: '#B98724',
          600: '#9A6E18',
          700: '#7A5712'
        },
        ivory: {
          50:  '#FFFCF6',
          100: '#FBF5E7',
          200: '#F4EAD0'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'mandala-radial': 'radial-gradient(circle at 50% 50%, rgba(185,135,36,0.15) 0%, rgba(185,135,36,0) 60%)',
        'temple-gradient': 'linear-gradient(180deg, #FFFCF6 0%, #FBF5E7 100%)',
        'hero-glow': 'radial-gradient(ellipse at top, rgba(233,123,17,0.25) 0%, rgba(139,39,39,0.0) 60%)'
      },
      boxShadow: {
        'altar': '0 20px 50px -20px rgba(86,20,20,0.35)',
        'soft-gold': '0 6px 24px -6px rgba(185,135,36,0.45)'
      },
      keyframes: {
        flicker: {
          '0%,100%': { opacity: '0.95', transform: 'scale(1)' },
          '50%':     { opacity: '0.7',  transform: 'scale(1.04)' }
        },
        slowSpin: { '0%': { transform: 'rotate(0)' }, '100%': { transform: 'rotate(360deg)' } },
        glowPulse: {
          '0%,100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%':     { opacity: '0.85', transform: 'scale(1.06)' }
        },
        emberRise: {
          '0%':   { opacity: '0', transform: 'translateY(0) scale(1)' },
          '25%':  { opacity: '0.9' },
          '100%': { opacity: '0', transform: 'translateY(-24px) scale(0.4)' }
        }
      },
      animation: {
        flicker: 'flicker 2.4s ease-in-out infinite',
        'slow-spin': 'slowSpin 60s linear infinite',
        'glow-pulse': 'glowPulse 3.6s ease-in-out infinite',
        'ember-rise': 'emberRise 2.8s ease-out infinite'
      }
    }
  },
  plugins: []
};
export default config;
