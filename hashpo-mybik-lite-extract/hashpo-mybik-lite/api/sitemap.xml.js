/**
 * Sitemap dinâmico para o Vercel.
 * Busca todos os mini sites publicados no Supabase e gera XML com URLs estáticas + /@slug.
 * Acessível em /api/sitemap.xml; rewrite em vercel.json serve em /sitemap.xml.
 */

const { createClient } = require('@supabase/supabase-js');

const BASE = 'https://hashpo.com';

const STATIC_URLS = [
  { loc: `${BASE}/`, changefreq: 'daily', priority: '1.0' },
  { loc: `${BASE}/directory`, changefreq: 'daily', priority: '0.9' },
  { loc: `${BASE}/professionais`, changefreq: 'daily', priority: '0.9' },
  { loc: `${BASE}/careers`, changefreq: 'daily', priority: '0.9' },
  { loc: `${BASE}/exchange`, changefreq: 'daily', priority: '0.9' },
  { loc: `${BASE}/exchange/index`, changefreq: 'daily', priority: '0.8' },
  { loc: `${BASE}/exchange/futures`, changefreq: 'daily', priority: '0.8' },
  { loc: `${BASE}/marketplace`, changefreq: 'daily', priority: '0.8' },
  { loc: `${BASE}/slugs`, changefreq: 'daily', priority: '0.8' },
  { loc: `${BASE}/how-it-works`, changefreq: 'monthly', priority: '0.7' },
  { loc: `${BASE}/auction`, changefreq: 'daily', priority: '0.7' },
  { loc: `${BASE}/auth`, changefreq: 'monthly', priority: '0.6' },
];

function escapeXml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlToXml(url) {
  const lastmod = url.lastmod ? `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : '';
  return `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <changefreq>${escapeXml(url.changefreq || 'weekly')}</changefreq>
    <priority>${escapeXml(url.priority || '0.7')}</priority>${lastmod}
  </url>`;
}

module.exports = async function handler(req, res) {
  try {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.status(200).send(buildFallbackXml());
    }

    const supabase = createClient(url, key);
    const { data: sites, error } = await supabase
      .from('mini_sites')
      .select('slug, updated_at')
      .eq('published', true)
      .or('blocked.eq.false,blocked.is.null');

    const urls = [...STATIC_URLS];

    if (!error && Array.isArray(sites)) {
      for (const row of sites) {
        if (row.slug) {
          urls.push({
            loc: `${BASE}/@${encodeURIComponent(row.slug)}`,
            changefreq: 'weekly',
            priority: '0.8',
            lastmod: row.updated_at ? row.updated_at.split('T')[0] : null,
          });
        }
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(urlToXml).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate');
    res.status(200).send(xml);
  } catch (err) {
    console.error('sitemap error', err);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(buildFallbackXml());
  }
}

function buildFallbackXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_URLS.map(urlToXml).join('\n')}
</urlset>`;
}
