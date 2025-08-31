import fs from 'fs';
import path from 'path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { spawn } from 'child_process';

const ROOT_DIR = process.cwd();
const AUDITS_DIR = path.join(ROOT_DIR, 'audits');
const SERVER_PORT = 8080;
const TARGET_URL = `http://localhost:${SERVER_PORT}/`;

async function runPerformanceAudit() {
    console.log('🚀 Starting Lighthouse performance audit...');

    // 1. Start the local server
    const server = spawn('npx', ['http-server', '-p', SERVER_PORT], {
        stdio: 'ignore', // We don't need to see the server's output
        shell: true
    });

    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    let chrome;
    try {
        // 2. Launch Chrome
        console.log('🚗 Launching Chrome...');
        chrome = await launch({
            chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
        });

        const options = {
            logLevel: 'info',
            output: 'html',
            port: chrome.port
        };

        // 3. Run Lighthouse
        console.log(`🔬 Auditing ${TARGET_URL}...`);
        const runnerResult = await lighthouse(TARGET_URL, options);

        // 4. Save the report
        if (!fs.existsSync(AUDITS_DIR)) {
            fs.mkdirSync(AUDITS_DIR, { recursive: true });
        }
        const reportHtml = runnerResult.report;
        const reportPath = path.join(AUDITS_DIR, `lighthouse-report-${new Date().toISOString().split('T')[0]}.html`);
        fs.writeFileSync(reportPath, reportHtml);

        console.log(`\n📊 Lighthouse report saved to: ${reportPath}`);

        // 5. Print summary to console
        printSummary(runnerResult.lhr.categories);

    } catch (error) {
        console.error('❌ Lighthouse audit failed:', error);
    } finally {
        // 6. Clean up
        if (chrome) {
            await chrome.kill();
            console.log('✅ Chrome instance closed.');
        }
        server.kill();
        console.log('✅ Local server stopped.');
    }
}

function printSummary(categories) {
    console.log('\n--- 📈 LIGHTHOUSE SCORE SUMMARY ---');
    for (const categoryName in categories) {
        const category = categories[categoryName];
        const score = Math.round(category.score * 100);
        const emoji = score >= 90 ? '✅' : score >= 50 ? '⚠️' : '❌';
        console.log(`${emoji} ${category.title}: ${score}`);
    }
    console.log('------------------------------------');
}

runPerformanceAudit().catch(console.error);
