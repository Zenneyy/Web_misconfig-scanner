import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { isInScope } from './scope.js';

export const fetchSitemapUrls = async (startUrl) => {
    const discoveredUrls = new Set();
    const baseUrl = new URL(startUrl).origin;

    // 1. Guess standard locations
    const commonPaths = [
        // 1. The Standards
        '/robots.txt',
        '/sitemap.xml',
        '/sitemap_index.xml',
        '/sitemap-index.xml',

        // 2. CMS Specifics (High Value)
        '/wp-sitemap.xml',       // WordPress 5.5+ Native
        '/sitemap.php',          // Custom PHP generators (Common in older sites)
        '/sitemap.txt',          // Plain text format
        '/sitemap/sitemap.xml',  // Subdirectory structure (common in Magento/PrestaShop)
        '/feeds/posts/default',  // Blogger / Blogspot
        '/rss.xml',              // RSS feeds often list all recent content
        '/atom.xml',             // Atom feeds

        // 3. Common Plugin Variations (Yoast, All-in-One SEO, etc.)
        '/1_index_sitemap.xml',
        '/sitemap_1.xml',        // Paginated sitemaps
        '/sitemap-main.xml',
        '/sitemap_index.xml',
    ];
    // Generate full URLs safely
    const candidates = commonPaths.map(path => new URL(path, baseUrl).toString());

    console.log(`[Sitemap] Checking for sitemaps at ${baseUrl}...`);

    for (const url of candidates) {
        try {
            const res = await axios.get(url, { timeout: 3000, validateStatus: () => true });
            if (res.status !== 200) continue;

            // Handle robots.txt
            if (url.endsWith('robots.txt')) {
                const match = res.data.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
                if (match && isInScope(match[1], startUrl)) {
                    candidates.push(match[1]);
                }
                continue;
            }

            // Handle XML
            if (typeof res.data === 'string' && (res.data.trim().startsWith('<?xml') || res.headers['content-type']?.includes('xml'))) {
                const $ = cheerio.load(res.data, { xmlMode: true });

                $('loc').each((_, el) => {
                    const loc = $(el).text().trim();
                    // <--- Use your helper instead of manual origin checking
                    if (loc && isInScope(loc, startUrl)) {
                        discoveredUrls.add(loc);
                    }
                });
            }
        } catch (err) {
            // Ignore network errors
        }
    }

    const results = Array.from(discoveredUrls);
    if (results.length > 0) console.log(`[Sitemap] Found ${results.length} URLs.`);
    return results;
};