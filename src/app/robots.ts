import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/login', '/signup', '/watchlist', '/saved'],
      },
    ],
    sitemap: 'https://neural-wire-nine.vercel.app/sitemap.xml',
  };
}
