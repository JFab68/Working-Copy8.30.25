// scripts/generate-sitemap.js
// Generates a sitemap.xml file by scanning for HTML files.

import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

const SITE_ROOT = 'https://praxisinitiative.org';
const SOURCE_DIR = process.cwd();
const HTML_FILES_PATTERN = '**/*.html';
const IGNORE_PATTERNS = ['node_modules/**', 'audits/**'];
const OUTPUT_FILE = path.join(SOURCE_DIR, 'sitemap.xml');

async function generateSitemap() {
    console.log('🗺️  Generating sitemap...');

    const files = await glob(HTML_FILES_PATTERN, {
        cwd: SOURCE_DIR,
        ignore: IGNORE_PATTERNS,
        nodir: true,
    });

    const urls = files.map(file => {
        const pagePath = path.join(SOURCE_DIR, file);
        const stats = fs.statSync(pagePath);
        const lastMod = stats.mtime.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Create a clean URL path
        let urlPath = file.replace(/\\/g, '/');
        if (path.basename(urlPath).startsWith('1 Homepage') || path.basename(urlPath) === 'index.html') {
            urlPath = ''; // Root URL
        } else {
            urlPath = urlPath.replace(/\.html$/, ''); // Remove .html extension
        }

        const fullUrl = `${SITE_ROOT}/${urlPath}`;

        return `
    <url>
        <loc>${fullUrl}</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
    }).join('');

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

    fs.writeFileSync(OUTPUT_FILE, sitemapContent.trim());
    console.log(`✅ Sitemap generated successfully at: ${path.relative(SOURCE_DIR, OUTPUT_FILE)}`);
}

generateSitemap().catch(console.error);