import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const ROOT_DIR = process.cwd();
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');
const PAGES_DIR = path.join(ROOT_DIR, 'pages');
const INCLUDES_DIR = path.join(ROOT_DIR, 'includes');

export default async function buildPages() {
    console.log('📄 Building HTML pages from partials...');

    try {
        // 1. Read all the reusable parts
        const baseTemplate = await fs.readFile(path.join(TEMPLATES_DIR, 'base.html'), 'utf-8');
        const header = await fs.readFile(path.join(INCLUDES_DIR, 'header.html'), 'utf-8');
        const footer = await fs.readFile(path.join(INCLUDES_DIR, 'footer.html'), 'utf-8');

        // 2. Find all page content files
        const pageFiles = await glob('**/*.html', { cwd: PAGES_DIR });

        if (pageFiles.length === 0) {
            console.log('⚠️ No page files found in /pages directory. Nothing to build.');
            return;
        }

        // 3. Process each page
        for (const pageFile of pageFiles) {
            const contentHtml = await fs.readFile(path.join(PAGES_DIR, pageFile), 'utf-8');
            
            // Simple placeholder replacement
            let finalHtml = baseTemplate
                .replace('{{HEADER}}', header)
                .replace('{{PAGE_CONTENT}}', contentHtml)
                .replace('{{FOOTER}}', footer);

            // A more advanced version could handle page-specific titles, etc.
            // For now, we'll keep it simple.

            const outputFileName = path.basename(pageFile);
            const outputPath = path.join(ROOT_DIR, outputFileName);
            
            await fs.writeFile(outputPath, finalHtml, 'utf-8');
            console.log(`  ✅ Built: ${outputFileName}`);
        }

        console.log(`\n✨ Successfully built ${pageFiles.length} pages.`);

    } catch (error) {
        console.error('❌ Error building pages:', error.message);
        if (error.code === 'ENOENT') {
            console.error('  Ensure `templates/base.html`, `includes/header.html`, and `includes/footer.html` exist.');
        }
        process.exit(1);
    }
}

// This ensures the script runs only when executed directly
if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
    buildPages().catch(error => {
        console.error(error);
        process.exit(1);
    });
}