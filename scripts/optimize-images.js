import sharp from 'sharp';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

const INPUT_DIR = '10 Assets/**/*.{jpg,jpeg,png,gif}';
const OUTPUT_DIR = 'assets/images';
const SIZES = [400, 800, 1200, 1600]; // Widths in pixels
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 85;

async function optimizeImages() {
    console.log('🚀 Starting image optimization...');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const files = await glob(INPUT_DIR, { nodir: true });
    if (files.length === 0) {
        console.log(`⚠️  No images found in '${INPUT_DIR}'. Please check the path.`);
        return;
    }
    console.log(`🔍 Found ${files.length} images to optimize.`);

    for (const file of files) {
        const inputPath = path.resolve(file);
        const originalFileName = path.basename(file, path.extname(file));
        const originalExtension = path.extname(file).toLowerCase();
        
        // Sanitize filename for web use
        const sanitizedFileName = originalFileName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        console.log(`Processing: ${file} -> ${sanitizedFileName}`);

        const image = sharp(inputPath);

        for (const size of SIZES) {
            // --- Generate WebP ---
            const webpOutputName = `${sanitizedFileName}-${size}w.webp`;
            const webpOutputPath = path.join(OUTPUT_DIR, webpOutputName);
            try {
                await image
                    .resize({ width: size })
                    .webp({ quality: WEBP_QUALITY })
                    .toFile(webpOutputPath);
                console.log(`  ✅ Created ${webpOutputPath}`);
            } catch (err) {
                console.error(`  ❌ Failed to create WebP for ${file} at ${size}w:`, err);
            }

            // --- Generate Fallback (JPEG/PNG) ---
            const fallbackExtension = originalExtension === '.png' ? '.png' : '.jpg';
            const fallbackOutputName = `${sanitizedFileName}-${size}w${fallbackExtension}`;
            const fallbackOutputPath = path.join(OUTPUT_DIR, fallbackOutputName);
            
            try {
                const fallbackImage = image.resize({ width: size });
                if (fallbackExtension === '.jpg') {
                    await fallbackImage.jpeg({ quality: JPEG_QUALITY }).toFile(fallbackOutputPath);
                } else { // .png
                    await fallbackImage.png({ quality: JPEG_QUALITY }).toFile(fallbackOutputPath);
                }
                console.log(`  ✅ Created ${fallbackOutputPath}`);
            } catch (err) {
                console.error(`  ❌ Failed to create fallback for ${file} at ${size}w:`, err);
            }
        }
    }

    console.log('\n✨ Image optimization complete!');
    console.log(`Optimized images are available in the '${OUTPUT_DIR}' directory.`);
}

optimizeImages().catch(console.error);