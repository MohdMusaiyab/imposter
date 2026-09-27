import type { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Prevent Google from trying to desperately index dynamic active private game rooms
      disallow: ['/room/*'], 
    },
    sitemap: 'https://hey-imposter.vercel.app/sitemap.xml',
  };
}
