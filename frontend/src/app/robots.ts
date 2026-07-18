import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/personal/', '/org/', '/settings'],
    },
    sitemap: 'https://kitatur.rinzgroup.web.id/sitemap.xml',
  }
}
