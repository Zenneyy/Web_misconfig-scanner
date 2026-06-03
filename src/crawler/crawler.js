import * as cheerio from 'cheerio';
import { URL } from 'url';
import { fetchUrl } from '../core/httpClient.js';
import { fetchSitemapUrls } from './sitemap.js';

export const crawl = async (startUrl, maxDepth = 1, maxUrls = 20, timeout = 3000) => {
  const visited = new Set();
  const queue = [{ url: startUrl, depth: 0 }];
  const baseObj = new URL(startUrl);
  const urls = [];

  // --- 2. SITEMAP INJECTION PHASE ---
  // Only try this if we are allowed to crawl deeper than just the homepage
  if (maxDepth > 0) {
    try {
      const sitemapLinks = await fetchSitemapUrls(startUrl);
      
      // Don't let sitemap use more than 50% of the budget so we still crawl normally
      const sitemapBudget = Math.floor(maxUrls / 2);
      
      for (const link of sitemapLinks.slice(0, sitemapBudget)) {
        // Add to queue with depth 1 (treating them as if found on homepage)
        // Check if unique before pushing
        const isDuplicate = queue.some(item => item.url === link);
        if (!isDuplicate && link !== startUrl) {
          queue.push({ url: link, depth: 1 });
        }
      }
    } catch (e) {
      console.log('Sitemap fetch failed, continuing normal crawl...');
    }
  }

  while (queue.length > 0 && visited.size < maxUrls) {
    const { url, depth } = queue.shift();
    if (visited.has(url) || depth > maxDepth) continue;

    visited.add(url);
    urls.push(url);

    try {
      const response = await fetchUrl(url, { timeout });

      if (response.status === 200 && response.data && depth < maxDepth) {
        const links = extractLinks(response.data, url, baseObj);

        for (const link of links) {
          if (!visited.has(link) && visited.size < maxUrls) {
            queue.push({ url: link, depth: depth + 1 });
          }
        }
      }
    } catch {
      // continue
    }
  }

  return urls;
};

const extractLinks = (html, baseUrl, originUrl) => {
  const links = [];
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href || href.startsWith('javascript:')) return;

    try {
      const absoluteUrl = new URL(href, base).href;
      const urlObj = new URL(absoluteUrl);

      if (urlObj.origin === originUrl.origin) {
        urlObj.hash = '';
        urlObj.search = ''; // Be careful: Sitemaps often contain params you want!
        links.push(urlObj.href);
      }
    } catch {
      // skip
    }
  });

  return [...new Set(links)];
};