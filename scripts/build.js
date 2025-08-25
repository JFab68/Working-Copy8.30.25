const fs = require('fs/promises');
const path = require('path');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  const root = __dirname.replace(/scripts$/, '');
  const dist = path.join(root, 'dist');
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist);

  const header = await fs.readFile(path.join(root, 'includes', 'header.html'), 'utf8');
  const footer = await fs.readFile(path.join(root, 'includes', 'footer.html'), 'utf8');

  const files = await fs.readdir(root);
  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    const filePath = path.join(root, file);
    let html = await fs.readFile(filePath, 'utf8');
    html = html.replace('<div id="global-header"></div>', header);
    html = html.replace(/<footer id="global-footer"[^>]*><\/footer>/, footer);
    await fs.writeFile(path.join(dist, file), html);
  }

  for (const dir of ['css', 'js', '10 Assets']) {
    const srcDir = path.join(root, dir);
    if (await fs.stat(srcDir).catch(() => false)) {
      await copyDir(srcDir, path.join(dist, dir));
    }
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
