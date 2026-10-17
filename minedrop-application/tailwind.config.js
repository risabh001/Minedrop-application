/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0d10',
          900: '#10151a',
          800: '#171e25',
          700: '#212a33',
          600: '#2e3944',
          500: '#48555f',
          400: '#6c7a83',
          300: '#98a3aa',
          200: '#c3cbcf',
          100: '#e7eaec',
        },
        drop: {
          600: '#2b7a78',
          500: '#37a29f',
          400: '#57bfba',
          300: '#8fd8d3',
        },
        signal: {
          600: '#c2410c',
          500: '#e0621f',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'portal-glow':
          'radial-gradient(ellipse 70% 45% at 15% -10%, rgba(55,162,159,0.16), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(87,191,186,0.08), transparent)',
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 20px 40px -24px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
