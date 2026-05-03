import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
    const siteURL = import.meta.env.PUBLIC_SITE_URL ?? site?.toString() ?? 'https://andreas.jilvero.se';
    const body = `User-agent: *\nAllow: /\nSitemap: ${siteURL.replace(/\/$/, '')}/sitemap-index.xml\n`;
    return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
