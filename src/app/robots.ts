import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/newsroom/',
    },
    sitemap: 'https://in-naija.vercel.app/sitemap.xml',
  };
}
