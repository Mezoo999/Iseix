import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // الألوان الرئيسية
        primary: {
          DEFAULT: '#3B82F6', // أزرق فاتح
          dark: '#2563EB',    // أزرق داكن
          light: '#93C5FD',   // أزرق فاتح جدًا
        },
        // الألوان الثانوية
        secondary: {
          DEFAULT: '#8B5CF6', // بنفسجي
          dark: '#7C3AED',    // بنفسجي داكن
          light: '#C4B5FD',   // بنفسجي فاتح
        },
        // ألوان الحالة
        success: {
          DEFAULT: '#10B981', // أخضر
          dark: '#059669',    // أخضر داكن
          light: '#6EE7B7',   // أخضر فاتح
        },
        warning: {
          DEFAULT: '#F59E0B', // برتقالي
          dark: '#D97706',    // برتقالي داكن
          light: '#FCD34D',   // برتقالي فاتح
        },
        error: {
          DEFAULT: '#EF4444', // أحمر
          dark: '#DC2626',    // أحمر داكن
          light: '#FCA5A5',   // أحمر فاتح
        },
        info: {
          DEFAULT: '#3B82F6', // أزرق
          dark: '#2563EB',    // أزرق داكن
          light: '#93C5FD',   // أزرق فاتح
        },
        // ألوان الخلفية والنص
        background: {
          DEFAULT: '#0A1A3B',      // أزرق داكن
          light: '#132B5E',        // أزرق داكن فاتح
          lighter: '#1D3A7D',      // أزرق متوسط
          dark: '#061029',         // أزرق داكن جدًا
        },
        foreground: {
          DEFAULT: '#FFFFFF',      // أبيض
          muted: '#CBD5E1',        // رمادي فاتح
          light: '#94A3B8',        // رمادي متوسط
          inverted: '#0A1A3B',     // أزرق داكن (عكس الخلفية)
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
        heading: ['Cairo', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.25rem',
        DEFAULT: '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-in-out',
        'slide-down': 'slideDown 0.5s ease-in-out',
        'slide-left': 'slideLeft 0.5s ease-in-out',
        'slide-right': 'slideRight 0.5s ease-in-out',
        'bounce-light': 'bounceLight 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceLight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
