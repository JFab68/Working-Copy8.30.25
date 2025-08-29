// tools/audit-cards.mjs
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { globSync } from "glob";
import puppeteer from "puppeteer";

// ----- CONFIG -----
const PORT = 8080;
const ROOT = process.cwd();
const SELECTORS = [
  "[class*=card]",
  ".card", ".cards .card",
  ".program-card", ".blog-card", ".news-card", ".grid-card", ".feature-card"
];
const EXCLUDES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/audits/**",
  "**/visual-audit-results/**", // exclude screenshots from crawling
];

// ----- UTIL -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function discoverHtmlFiles() {
  return globSync("**/*.html", { cwd: ROOT, ignore: EXCLUDES }).sort();
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
};

function startTinyServer(root, port) {
  const server = http.createServer((req, res) => {
    try {
      // Normalize and prevent path traversal
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      let filePath = path.join(root, urlPath);

      // If directory, serve index.html
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.statusCode = 404;
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      fs.createReadStream(filePath).pipe(res);
    } catch (e) {
      res.statusCode = 500;
      res.end("Server error");
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => resolve(server)).on("error", reject);
  });
}

async function auditPage(browser, url, selectorQuery) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  await page.goto(url, { waitUntil: ["domcontentloaded", "networkidle0"] });

  const result = await page.evaluate((q) => {
    const els = Array.from(document.querySelectorAll(q));
    let total = 0, visible = 0;
    for (const el of els) {
      total++;
      const cs = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const isVisible =
        cs.display !== "none" &&
        cs.visibility !== "hidden" &&
        cs.opacity !== "0" &&
        r.width > 0 &&
        r.height > 0;
      if (isVisible) visible++;
    }
    return { total, visible, hidden: total - visible };
  }, selectorQuery);

  await page.close();
  return result;
}

(async () => {
  const htmlFiles = discoverHtmlFiles();
  if (!htmlFiles.length) {
    console.error("No HTML files found. Run this in your built/static site root.");
    process.exit(2);
  }

  const selectorQuery = Array.from(new Set(SELECTORS)).join(",");
  const server = await startTinyServer(ROOT, PORT);

  const browser = await puppeteer.launch({ headless: "new" });

  const rows = [];
  for (const rel of htmlFiles) {
    const url = `http://localhost:${PORT}/${rel.replace(/\\/g, "/")}`;
    try {
      const { total, visible, hidden } = await auditPage(browser, url, selectorQuery);
      rows.push({ page: rel, total, visible, hidden });
      process.stdout.write(`• ${rel}  total:${total}  visible:${visible}  hidden:${hidden}\n`);
    } catch (e) {
      rows.push({ page: rel, total: 0, visible: 0, hidden: 0, error: e.message });
      process.stdout.write(`! ${rel}  ERROR: ${e.message}\n`);
    }
  }

  await browser.close();

  // Summaries
  const sum = rows.reduce((a, r) => {
    a.total += r.total; a.visible += r.visible; a.hidden += r.hidden; return a;
  }, { total: 0, visible: 0, hidden: 0 });

  // Output CSV
  const outDir = path.join(ROOT, "audits");
  fs.mkdirSync(outDir, { recursive: true });
  const csv = [
    "page,total_cards,visible_cards,hidden_or_missing",
    ...rows.map(r => `${r.page},${r.total},${r.visible},${r.hidden}`)
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "card-visibility.csv"), csv, "utf8");

  console.log("\n=== SUMMARY ===");
  console.log(`Total cards:   ${sum.total}`);
  console.log(`Visible cards: ${sum.visible}`);
  console.log(`Missing/hidden:${sum.hidden}`);
  console.log(`Wrote: audits/card-visibility.csv`);

  server.close();
})();
