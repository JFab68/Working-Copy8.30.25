// scripts/minify-assets.js
// Finds and minifies all non-minified CSS and JavaScript files for production.

import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import postcss from 'postcss';
import cssnano from 'cssnano';
import { minify } from 'terser';

const CSS_SRC = 'css/**/*.css';
const JS_SRC = 'js/**/*.js';
const IGNORE_PATTERN = '**/*.min.*';

async function minifyCSS() {
    console.log('🔍 Finding and minifying CSS files...');
    const files = await glob(CSS_SRC, { ignore: IGNORE_PATTERN });

    if (files.length === 0) {
        console.log('✅ No new CSS files to minify.');
        return;
    }

    for (const file of files) {
        const inputPath = path.resolve(file);
        const outputPath = inputPath.replace(/\.css$/, '.min.css');
        
        try {
            const css = await fs.readFile(inputPath, 'utf8');
            const result = await postcss([cssnano]).process(css, { from: inputPath, to: outputPath });
            await fs.writeFile(outputPath, result.css);
            console.log(`  ✅ Minified: ${file} -> ${path.basename(outputPath)}`);
        } catch (err) {
            console.error(`  ❌ Failed to minify ${file}:`, err);
        }
    }
}

async function minifyJS() {
    console.log('\n🔍 Finding and minifying JavaScript files...');
    const files = await glob(JS_SRC, { ignore: IGNORE_PATTERN });

    if (files.length === 0) {
        console.log('✅ No new JavaScript files to minify. Create a `js/` directory and add files to enable.');
        return;
    }

    for (const file of files) {
        const inputPath = path.resolve(file);
        const outputPath = inputPath.replace(/\.js$/, '.min.js');
        
        try {
            const code = await fs.readFile(inputPath, 'utf8');
            const result = await minify(code, {
                sourceMap: false,
                mangle: { toplevel: true },
            });
            if (result.code) {
                await fs.writeFile(outputPath, result.code);
                console.log(`  ✅ Minified: ${file} -> ${path.basename(outputPath)}`);
            } else {
                throw new Error('Terser returned no code.');
            }
        } catch (err) {
            console.error(`  ❌ Failed to minify ${file}:`, err);
        }
    }
}

async function main() {
    console.log('🚀 Starting asset minification for production...');
    await minifyCSS();
    await minifyJS();
    console.log('\n✨ Asset minification complete!');
}

main().catch(console.error);