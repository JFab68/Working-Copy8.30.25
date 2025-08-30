// scripts/audit-links.js
// Audits all HTML files for broken links (internal and external).

import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const HTML_FILES_PATTERN = '**/*.html';
const IGNORE_PATTERNS = ['node_modules/**', 'audits/**'];
const CONCURRENT_CHECKS = 10; // Number of external links to check at once

// Regex to find href and src attributes. It's not a full HTML parser but is sufficient for this static site.
const LINK_REGEX = /(?:href|src)="([^"]+)"/g;

class LinkAuditor {
    constructor() {
        this.linkQueue = new Map(); // Map<link, Set<sourceFile>>
        this.brokenLinks = [];
        this.checkedLinks = new Map(); // Cache for link statuses
    }

    async run() {
        console.log('🔗 Starting link audit...');
        await this.findAllLinks();
        await this.checkAllLinks();
        this.generateReport();

        if (this.brokenLinks.length > 0) {
            console.error(`\n❌ Found ${this.brokenLinks.length} broken links.`);
            return 1; // Exit with error code
        } else {
            console.log('\n✅ Success! No broken links found.');
            return 0;
        }
    }

    async findAllLinks() {
        const files = await glob(HTML_FILES_PATTERN, {
            cwd: ROOT_DIR,
            ignore: IGNORE_PATTERNS,
            nodir: true,
        });
        console.log(`🔍 Found ${files.length} HTML files to audit.`);

        for (const file of files) {
            const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
            let match;
            while ((match = LINK_REGEX.exec(content)) !== null) {
                const link = match[1].trim();
                if (!this.linkQueue.has(link)) {
                    this.linkQueue.set(link, new Set());
                }
                this.linkQueue.get(link).add(file);
            }
        }
        console.log(`📊 Found ${this.linkQueue.size} unique links to check.`);
    }

    async checkAllLinks() {
        const linksToCheck = Array.from(this.linkQueue.keys());
        const promises = [];

        for (const link of linksToCheck) {
            promises.push(this.checkLink(link));
            if (promises.length >= CONCURRENT_CHECKS) {
                await Promise.all(promises);
                promises.length = 0;
            }
        }
        await Promise.all(promises);
    }

    async checkLink(link) {
        if (this.checkedLinks.has(link)) return;

        if (!link || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('javascript:') || link.startsWith('#')) {
            this.checkedLinks.set(link, { status: 'skipped', reason: 'Special protocol or anchor' });
            return;
        }

        if (link.startsWith('http://') || link.startsWith('https://')) {
            await this.checkExternalLink(link);
        } else {
            this.checkInternalLink(link);
        }
    }

    checkInternalLink(link) {
        const sourceFiles = this.linkQueue.get(link);
        const [baseLink] = link.split('#');
        const firstSource = Array.from(sourceFiles)[0];
        let absolutePath;

        if (baseLink.startsWith('/')) {
            absolutePath = path.join(ROOT_DIR, baseLink);
        } else {
            absolutePath = path.resolve(path.join(ROOT_DIR, path.dirname(firstSource)), baseLink);
        }

        if (fs.existsSync(absolutePath)) {
            this.checkedLinks.set(link, { status: 'ok' });
        } else {
            const error = { link, reason: `File not found at expected path: ${path.relative(ROOT_DIR, absolutePath)}`, sources: Array.from(sourceFiles) };
            this.brokenLinks.push(error);
            this.checkedLinks.set(link, { status: 'broken', reason: 'File not found' });
        }
    }

    async checkExternalLink(link) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(link, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Link-Checker-Bot/1.0)' },
                redirect: 'follow'
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                this.checkedLinks.set(link, { status: 'ok', httpStatus: response.status });
            } else {
                const error = { link, reason: `HTTP Error: ${response.status}`, sources: Array.from(this.linkQueue.get(link)) };
                this.brokenLinks.push(error);
                this.checkedLinks.set(link, { status: 'broken', reason: `HTTP Error: ${response.status}` });
            }
        } catch (error) {
            const reason = error.name === 'AbortError' ? 'Timeout' : error.message;
            const broken = { link, reason, sources: Array.from(this.linkQueue.get(link)) };
            this.brokenLinks.push(broken);
            this.checkedLinks.set(link, { status: 'broken', reason });
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: { totalUniqueLinks: this.linkQueue.size, brokenLinksCount: this.brokenLinks.length },
            brokenLinks: this.brokenLinks,
        };

        const outDir = path.join(ROOT_DIR, 'audits');
        fs.mkdirSync(outDir, { recursive: true });
        const reportPath = path.join(outDir, 'link-audit-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📊 Detailed report saved to: ${reportPath}`);

        if (this.brokenLinks.length > 0) {
            console.log('\n--- BROKEN LINKS ---');
            this.brokenLinks.forEach(item => {
                console.log(`\n❌ Link: ${item.link}`);
                console.log(`   Reason: ${item.reason}`);
                console.log(`   Found in:\n     - ${item.sources.join('\n     - ')}`);
            });
        }
    }
}

async function main() {
    const auditor = new LinkAuditor();
    const exitCode = await auditor.run();
    process.exit(exitCode);
}

main().catch(error => {
    console.error('An unexpected error occurred during the link audit:', error);
    process.exit(2);
});