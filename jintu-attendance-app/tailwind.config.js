import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'accordion-down': {
          from: { maxHeight: '0', opacity: '0' },
          to: { maxHeight: '70vh', opacity: '1' },
        },
        'accordion-up': {
          from: { maxHeight: '70vh', opacity: '1' },
          to: { maxHeight: '0', opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.3s ease-out',
        'accordion-up': 'accordion-up 0.25s ease-in',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: 'var(--outline)',
        background: 'var(--bg)',
        foreground: 'var(--on-surface)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--on-primary)' },
        destructive: 'var(--error)',
        muted: { DEFAULT: 'var(--surface-2)', foreground: 'var(--on-surface-muted)' },
        accent: { DEFAULT: 'var(--primary-container)', foreground: 'var(--on-primary-container)' },
        card: { DEFAULT: 'var(--surface)', foreground: 'var(--on-surface)' },
        input: 'var(--outline)',
        ring: 'var(--primary)',
        success: 'var(--success)',
        leave: 'var(--leave)',
        late: 'var(--late)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        'elevation-1': '0 2px 10px rgba(28, 27, 24, 0.04), 0 1px 2px rgba(28, 27, 24, 0.04)',
        'elevation-2': '0 8px 28px rgba(28, 27, 24, 0.06), 0 2px 8px rgba(28, 27, 24, 0.04)',
        'elevation-bar': '0 -4px 24px rgba(28, 27, 24, 0.06)',
        'elevation-card': '0 4px 20px rgba(28, 27, 24, 0.04), 0 1px 4px rgba(28, 27, 24, 0.03)',
        'glow-primary': '0 0 0 3px rgba(79, 70, 229, 0.25)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
