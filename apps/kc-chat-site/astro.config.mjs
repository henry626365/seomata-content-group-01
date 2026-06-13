import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://h540.com',
  integrations: [sitemap()],
  vite: {
    css: { devSourcemap: true },
  },
});
