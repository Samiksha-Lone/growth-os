/** @type {import('tailwindcss').Config} */

// Helper to allow opacity modifiers with custom hex colors
function withOpacity(variable) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      // Convert the raw hex into an rgb() with the opacity modifier applied
      return `rgba(var(${variable}), ${opacityValue})`;
    }
    return `rgb(var(${variable}))`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        card: '#161616',
        border: '#2a2a2a',
        primary: '#ffffff',
        secondary: '#a0a0a0',
        muted: '#696969',
        accent: '#00BFFF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '7': '1.75rem',
        '7.5': '1.875rem',
        '8.5': '2.125rem',
        '9': '2.25rem',
        '10': '2.5rem',
        '11': '2.75rem',
        '12': '3rem',
        '13': '3.25rem',
        '14': '3.5rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '20': '5rem',
        '22': '5.5rem',
        '24': '6rem',
        '28': '7rem',
        '30': '7.5rem',
        '32': '8rem',
        '35': '8.75rem',
        '36': '9rem',
        '40': '10rem',
        '44': '11rem',
        '45': '11.25rem',
        '48': '12rem',
        '52': '13rem',
        '55': '13.75rem',
        '56': '14rem',
        '60': '15rem',
        '64': '16rem',
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
        '100': '25rem',
        '120': '30rem',
        '135': '33.75rem',
      },
      minHeight: {
        '0': '0',
        '20': '5rem',
        '30': '7.5rem',
        '35': '8.75rem',
        '40': '10rem',
        '45': '11.25rem',
        '60': '15rem',
        'screen': '100vh',
      },
      minWidth: {
        '0': '0',
        '55': '13.75rem',
        'full': '100%',
        'min': 'min-content',
        'max': 'max-content',
      },
      maxWidth: {
        '100': '25rem',
        '120': '30rem',
        '135': '33.75rem',
        '140': '35rem',
        'none': 'none',
      },
      scale: {
        '98': '0.98',
        '99': '0.99',
        '100': '1',
        '101': '1.01',
        '102': '1.02',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}