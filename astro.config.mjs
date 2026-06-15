// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://borne-recharge-haute-garonne.fr',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/mentions-legales') &&
        !page.includes('/politique-confidentialite') &&
        !page.includes('/confirmation'),
      changefreq: 'weekly',
      lastmod: new Date(),
      priority: 0.7,
      serialize(item) {
        if (item.url === 'https://borne-recharge-haute-garonne.fr/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        else if (
          item.url.includes('/tarifs') ||
          item.url.includes('/aides-advenir') ||
          item.url.includes('/guide-installation') ||
          item.url.includes('/v2h-vehicule-to-home') ||
          item.url.includes('/devis')
        ) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        else if (item.url.includes('/guides')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        else if (item.url.includes('/communes')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        else if (item.url.includes('/installateur-borne-recharge-')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        else if (item.url.includes('/borne-recharge-copropriete-') || item.url.includes('/wallbox-')) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],
});
