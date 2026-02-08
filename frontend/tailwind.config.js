/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a14',
        },
      },
      animation: {
        'breach-flash': 'breach-flash 1.5s ease-out forwards',
        'slide-down': 'slide-down 0.3s ease-out',
        'breach-pulse': 'breach-pulse 1.5s ease-in-out infinite',
        'flow': 'flow 1s linear infinite',
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
        'scan-line': 'scan-line 8s linear infinite',
        // Voice agent orb animations
        'orb-breathe-1': 'orb-breathe 3s ease-in-out infinite',
        'orb-breathe-2': 'orb-breathe 3.5s ease-in-out 0.5s infinite',
        'orb-breathe-3': 'orb-breathe 4s ease-in-out 1s infinite',
        'orb-speak-1': 'orb-speak 0.8s ease-in-out infinite',
        'orb-speak-2': 'orb-speak 1.0s ease-in-out 0.1s infinite',
        'orb-speak-3': 'orb-speak 1.2s ease-in-out 0.2s infinite',
        'core-glow-red': 'core-glow-red 1.5s ease-in-out infinite',
        'core-glow-blue': 'core-glow-blue 1.5s ease-in-out infinite',
        'waveform-overload': 'waveform-overload 0.8s ease-in-out',
        'orb-shatter': 'orb-shatter 0.6s ease-out forwards',
        'ring-explode-1': 'orb-ring-explode 0.8s ease-out forwards',
        'ring-explode-2': 'orb-ring-explode 0.8s ease-out 0.1s forwards',
        'ring-explode-3': 'orb-ring-explode 0.8s ease-out 0.2s forwards',
        'particle-lr': 'data-particle-lr 1.2s linear infinite',
        'particle-rl': 'data-particle-rl 1.2s linear infinite',
        'transcript-fade': 'transcript-fade-in 0.4s ease-out',
      },
      keyframes: {
        'breach-flash': {
          '0%': { opacity: '0.5' },
          '30%': { opacity: '0.3' },
          '100%': { opacity: '0' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-30px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'breach-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '50%': { boxShadow: '0 0 0 12px rgba(239, 68, 68, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
        },
        'flow': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(400%)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}
