// scripts/audit-images.js
// Finds all <img> tags that have not been converted to the responsive <picture> element.

import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const HTML_FILES_PATTERN = '**/*.html';
const IGNORE_PATTERNS = ['node_modules/**', 'audits/**'];

async function auditImages() {
    console.log('🖼️  Starting image audit: Looking for <img> tags not wrapped in <picture>...');
    const report = {
        timestamp: new Date().toISOString(),
        unconvertedImages: [],
        summary: {
            filesScanned: 0,
            filesWithIssues: 0,
            totalIssues: 0,
        },
    };

    const files = await glob(HTML_FILES_PATTERN, {
        cwd: ROOT_DIR,
        ignore: IGNORE_PATTERNS,
        nodir: true,
    });

    report.summary.filesScanned = files.length;

    for (const file of files) {
        const filePath = path.join(ROOT_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // A robust way to find standalone <img> tags is to first remove all <picture> blocks.
        const contentWithoutPictureTags = content.replace(/<picture[\s\S]*?<\/picture>/gi, '');

        // Then, find any <img> tags that remain.
        const imgRegex = /<img[^>]+>/gi;
        const matches = contentWithoutPictureTags.match(imgRegex);

        if (matches && matches.length > 0) {
            report.summary.filesWithIssues++;
            report.summary.totalIssues += matches.length;

            const fileIssues = {
                file: file,
                images: matches.map(imgTag => {
                    const srcMatch = imgTag.match(/src="([^"]+)"/);
                    const altMatch = imgTag.match(/alt="([^"]+)"/);
                    return {
                        tag: imgTag,
                        src: srcMatch ? srcMatch[1] : 'N/A',
                        alt: altMatch ? altMatch[1] : 'N/A',
                    };
                }),
            };
            report.unconvertedImages.push(fileIssues);
        }
    }

    // Save detailed JSON report
    const outDir = path.join(ROOT_DIR, 'audits');
    fs.mkdirSync(outDir, { recursive: true });
    const reportPath = path.join(outDir, 'image-audit-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code for CI
    return report.summary.totalIssues > 0 ? 1 : 0;
}

auditImages()
    .then(exitCode => {
        if (exitCode !== 0) {
            console.log('\n❌ Action required: Convert the listed <img> tags to the <picture> element for optimal performance.');
        } else {
            console.log('\n✅ Success! All images are using the responsive <picture> element.');
        }
        process.exit(exitCode);
    })
    .catch(error => {
        console.error('An error occurred during the image audit:', error);
        process.exit(2);
    });