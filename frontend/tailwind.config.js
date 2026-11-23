/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effcf9',
          100: '#d5f5ee',
          200: '#aeeade',
          300: '#7bd9c9',
          400: '#43bfae',
          500: '#1aa594',
          600: '#0F766E',
          700: '#115e59',
          800: '#134b48',
          900: '#143e3c',
        },
        navy: {
          700: '#164E63',
          800: '#123c4c',
        },
        skyaccent: '#38BDF8',
        canvas: '#F8FAFC',
        emergency: '#DC2626',
        warning: '#F59E0B',
        success: '#16A34A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.15)',
        soft: '0 12px 32px -16px rgba(15, 118, 110, 0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        wave: 'wave 1s ease-in-out infinite',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
        fadeUp: 'fadeUp 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
