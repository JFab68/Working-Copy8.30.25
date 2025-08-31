// scripts/add-lang.js
// Adds lang="en" to <html> tags where it is missing.
// This is a cross-platform replacement for add-lang.ps1.

import { glob } from 'glob';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';

const HTML_FILES_PATTERN = '**/*.html';
const IGNORE_PATTERNS = ['node_modules/**', 'audits/**'];
const ROOT_DIR = process.cwd();

export default async function addLangAttribute() {
    console.log('🗣️  Checking HTML files for missing lang attribute...');
    const files = await glob(HTML_FILES_PATTERN, {
        cwd: ROOT_DIR,
        ignore: IGNORE_PATTERNS,
        nodir: true,
    });

    let updatedCount = 0;

    for (const file of files) {
        const filePath = path.join(ROOT_DIR, file);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const htmlTagRegex = /<html(?![^>]*\blang=)/i;

            if (htmlTagRegex.test(content)) {
                const newContent = content.replace(htmlTagRegex, '<html lang="en"');
                await fs.writeFile(filePath, newContent, 'utf8');
                console.log(`  ✅ Updated lang in: ${file}`);
                updatedCount++;
            }
        } catch (error) {
            console.error(`  ❌ Error processing ${file}:`, error.message);
        }
    }

    console.log(updatedCount > 0 ? `\n✨ Successfully updated ${updatedCount} file(s).` : '\n✅ All HTML files already have the lang attribute.');
}

// This ensures the script runs only when executed directly
if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
    addLangAttribute().catch(console.error);
}