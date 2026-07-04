// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'src',
  modules: [
    '@pinia/nuxt',
    'nuxt-quasar-ui',
  ],
  quasar: {
    plugins: [
      'Notify',
      'Dialog',
      'Loading',
    ],
    extras: {
      font: null, // We will load a premium Google Font (Outfit) in css/app.css
      fontIcons: ['material-icons', 'material-icons-outlined', 'material-icons-round', 'fontawesome-v6'],
    },
    config: {
      dark: false,
      brand: {
        primary: '#4f46e5',   // Premium Indigo
        secondary: '#06b6d4', // Premium Cyan
        accent: '#8b5cf6',    // Premium Violet
        dark: '#0f172a',      // Dark Slate (for dark/night mode elements)
        positive: '#10b981',  // Emerald Green
        negative: '#ef4444',  // Red Rose
        info: '#3b82f6',      // Royal Blue
        warning: '#f59e0b',   // Warm Amber
      },
    },
  },
  css: [
    '~/assets/css/main.css',
  ],
  app: {
    head: {
      title: 'MedCare - Smart Multi-Tenant Clinic Booking',
      meta: [
        { name: 'description', content: 'A modern, secure SaaS appointment booking portal for small clinics.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap' },
      ],
    },
  },
  devtools: { enabled: false },
});
