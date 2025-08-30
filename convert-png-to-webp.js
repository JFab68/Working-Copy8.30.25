const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertPngToWebp(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .webp({ quality: 85 })
            .toFile(outputPath);
        console.log(`Converted: ${inputPath} -> ${outputPath}`);
    } catch (error) {
        console.error(`Error converting ${inputPath}:`, error);
    }
}

async function convertAllPngToWebp() {
    const directories = [
        '10 Assets/praxis-logos',
        '10-assets/praxis-logos',
        '10 Assets/staff'
    ];

    for (const dir of directories) {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');

            for (const pngFile of pngFiles) {
                const inputPath = path.join(dir, pngFile);
                const outputPath = path.join(dir, path.basename(pngFile, '.png') + '.webp');

                await convertPngToWebp(inputPath, outputPath);
            }
        }
    }
}

convertAllPngToWebp().then(() => {
    console.log('All PNG to WebP conversions completed!');
}).catch(console.error);
