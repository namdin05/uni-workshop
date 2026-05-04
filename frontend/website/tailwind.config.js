/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        'on-primary-fixed': '#001b3c',
        'inverse-on-surface': '#f1f0f5',
        'secondary-fixed': '#dae4ed',
        'primary-fixed-dim': '#a7c8ff',
        'on-primary-container': '#799dd6',
        'on-tertiary-fixed': '#341100',
        'tertiary-fixed-dim': '#ffb690',
        'on-tertiary-fixed-variant': '#723610',
        'tertiary-fixed': '#ffdbca',
        'on-background': '#1a1c1f',
        'surface-container-highest': '#e2e2e7',
        'on-error': '#ffffff',
        'secondary-fixed-dim': '#bec8d0',
        'primary-fixed': '#d5e3ff',
        'surface': '#f9f9fe',
        'on-primary': '#ffffff',
        'surface-tint': '#3a5f94',
        'on-secondary': '#ffffff',
        'on-tertiary-container': '#d8885c',
        'surface-container': '#eeedf2',
        'on-primary-fixed-variant': '#1f477b',
        'primary-container': '#003366',
        'secondary': '#566067',
        'inverse-surface': '#2f3034',
        'on-surface': '#1a1c1f',
        'on-tertiary': '#ffffff',
        'background': '#f9f9fe',
        'surface-container-high': '#e8e8ed',
        'surface-container-lowest': '#ffffff',
        'on-surface-variant': '#43474f',
        'on-secondary-fixed-variant': '#3e484f',
        'on-secondary-fixed': '#131d23',
        'tertiary-container': '#592300',
        'on-secondary-container': '#5c666d',
        'outline': '#737780',
        'surface-dim': '#dad9de',
        'surface-variant': '#e2e2e7',
        'inverse-primary': '#a7c8ff',
        'tertiary': '#381300',
        'surface-bright': '#f9f9fe',
        'on-error-container': '#93000a',
        'outline-variant': '#c3c6d1',
        'primary': '#001e40',
        'secondary-container': '#dae4ed',
        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'surface-container-low': '#f4f3f8'
      },
      borderRadius: {
        'DEFAULT': '0.125rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
        'full': '0.75rem'
      },
      spacing: {
        'xs': '4px',
        'lg': '48px',
        'base': '8px',
        'sm': '12px',
        'gutter': '24px',
        'xl': '80px',
        'md': '24px',
        'container-max': '1280px'
      },
      fontFamily: {
        'h3': ['Inter'],
        'body-lg': ['Inter'],
        'label-md': ['Inter'],
        'h2': ['Inter'],
        'h1': ['Inter'],
        'body-md': ['Inter'],
        'label-sm': ['Inter']
      },
      fontSize: {
        'h3': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '600' }],
        'h2': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h1': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }]
      }
    }
  }
}
