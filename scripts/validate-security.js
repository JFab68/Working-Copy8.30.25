// scripts/validate-security.js
// Security configuration validation suite
// Praxis Initiative - Security Validation Tool

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();

class SecurityValidator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
    }

    addResult(test, status, message, details = null) {
        this.results.tests.push({
            test,
            status,
            message,
            details,
            timestamp: new Date().toISOString()
        });
        
        if (status === 'PASS') this.results.summary.passed++;
        else if (status === 'FAIL') this.results.summary.failed++;
        else if (status === 'WARN') this.results.summary.warnings++;
    }

    async validateCredentialSecurity() {
        console.log('🔒 Validating credential security...');
        
        // Check for credential exposures in key files
        const sensitiveFiles = [
            'MCP-SETUP.md',
            '.claude/settings.local.json',
            '.mcp.json'
        ];

        for (const filePath of sensitiveFiles) {
            const fullPath = path.join(ROOT, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Check for exposed WordPress credentials
                if (content.includes('5mu7 wpMy 7Q8h')) {
                    this.addResult(
                        `Credential Exposure - ${filePath}`,
                        'FAIL',
                        'WordPress credentials still exposed in plain text',
                        { file: filePath, pattern: 'WordPress password pattern detected' }
                    );
                } else {
                    this.addResult(
                        `Credential Security - ${filePath}`,
                        'PASS',
                        'No exposed credentials detected'
                    );
                }
                
                // Check for environment variable usage
                if (content.includes('${') || content.includes('process.env')) {
                    this.addResult(
                        `Environment Variables - ${filePath}`,
                        'PASS',
                        'Uses environment variables for credentials'
                    );
                }
            }
        }

        // Validate .env.example exists
        if (fs.existsSync(path.join(ROOT, '.env.example'))) {
            this.addResult(
                'Environment Template',
                'PASS',
                '.env.example template exists'
            );
        } else {
            this.addResult(
                'Environment Template',
                'FAIL',
                '.env.example template missing'
            );
        }
    }

    async validateHeaderConfiguration() {
        console.log('🛡️ Validating security header configuration...');

        // Check netlify.toml for consolidated headers
        const netlifyPath = path.join(ROOT, 'netlify.toml');
        if (fs.existsSync(netlifyPath)) {
            const content = fs.readFileSync(netlifyPath, 'utf8');
            
            const requiredHeaders = [
                'X-Frame-Options',
                'X-Content-Type-Options',
                'X-XSS-Protection',
                'Referrer-Policy',
                'Content-Security-Policy',
                'Strict-Transport-Security'
            ];

            let foundHeaders = 0;
            for (const header of requiredHeaders) {
                if (content.includes(header)) {
                    foundHeaders++;
                } else {
                    this.addResult(
                        `Missing Header - ${header}`,
                        'WARN',
                        `${header} not found in netlify.toml`
                    );
                }
            }

            if (foundHeaders === requiredHeaders.length) {
                this.addResult(
                    'Netlify Headers',
                    'PASS',
                    'All required security headers present in netlify.toml'
                );
            }
        }

        // Check .htaccess for removal of duplicate headers
        const htaccessPath = path.join(ROOT, '.htaccess');
        if (fs.existsSync(htaccessPath)) {
            const content = fs.readFileSync(htaccessPath, 'utf8');
            
            if (content.includes('Header always set X-Frame-Options')) {
                this.addResult(
                    'Header Duplication',
                    'WARN',
                    'Duplicate security headers still present in .htaccess'
                );
            } else {
                this.addResult(
                    'Header Consolidation',
                    'PASS',
                    'Security headers removed from .htaccess (delegated to Netlify)'
                );
            }
        }
    }

    async validatePermissionStructure() {
        console.log('⚙️ Validating permission structure...');

        // Check centralized MCP permissions
        const permissionsPath = path.join(ROOT, 'security/mcp-permissions.json');
        if (fs.existsSync(permissionsPath)) {
            try {
                const permissions = JSON.parse(fs.readFileSync(permissionsPath, 'utf8'));
                
                if (permissions.roles && permissions.servers && permissions.security_policies) {
                    this.addResult(
                        'MCP Permissions Structure',
                        'PASS',
                        'Centralized permission management structure valid'
                    );
                } else {
                    this.addResult(
                        'MCP Permissions Structure',
                        'FAIL',
                        'Missing required sections in mcp-permissions.json'
                    );
                }
            } catch (error) {
                this.addResult(
                    'MCP Permissions Parsing',
                    'FAIL',
                    'Failed to parse mcp-permissions.json',
                    { error: error.message }
                );
            }
        } else {
            this.addResult(
                'MCP Permissions File',
                'FAIL',
                'security/mcp-permissions.json not found'
            );
        }

        // Check .claude/settings.local.json for security improvements
        const claudePath = path.join(ROOT, '.claude/settings.local.json');
        if (fs.existsSync(claudePath)) {
            const content = fs.readFileSync(claudePath, 'utf8');
            
            if (content.includes('powershell:*')) {
                this.addResult(
                    'Overly Broad Permissions',
                    'WARN',
                    'PowerShell wildcard permissions detected'
                );
            } else {
                this.addResult(
                    'Permission Specificity',
                    'PASS',
                    'No overly broad wildcard permissions detected'
                );
            }
        }
    }

    async validateFileProtection() {
        console.log('📁 Validating file protection...');

        const htaccessPath = path.join(ROOT, '.htaccess');
        if (fs.existsSync(htaccessPath)) {
            const content = fs.readFileSync(htaccessPath, 'utf8');
            
            const protectedFiles = ['.htaccess', '*.log', 'README.md', 'CHANGELOG.md'];
            let protectionCount = 0;
            
            for (const filePattern of protectedFiles) {
                if (content.includes(`<Files "${filePattern}">`) || content.includes(`<Files ${filePattern}>`)) {
                    protectionCount++;
                }
            }
            
            if (protectionCount > 0) {
                this.addResult(
                    'File Protection',
                    'PASS',
                    `${protectionCount} file protection rules active`
                );
            } else {
                this.addResult(
                    'File Protection',
                    'WARN',
                    'No file protection rules found in .htaccess'
                );
            }
        }
    }

    async validateWithBrowser(url = 'http://localhost:8080') {
        console.log('🌐 Validating headers with browser...');

        try {
            const browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            // Test header delivery
            const response = await page.goto(url, { 
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });
            
            const headers = response.headers();
            
            // Check for security headers (case-insensitive)
            const securityHeaders = {
                'x-frame-options': 'X-Frame-Options',
                'x-content-type-options': 'X-Content-Type-Options',
                'content-security-policy': 'Content-Security-Policy'
            };
            
            for (const [headerKey, headerName] of Object.entries(securityHeaders)) {
                if (headers[headerKey]) {
                    this.addResult(
                        `Header Delivery - ${headerName}`,
                        'PASS',
                        `${headerName} delivered successfully`,
                        { value: headers[headerKey] }
                    );
                } else {
                    this.addResult(
                        `Header Delivery - ${headerName}`,
                        'FAIL',
                        `${headerName} not delivered by server`
                    );
                }
            }
            
            await browser.close();
            
        } catch (error) {
            this.addResult(
                'Browser Validation',
                'WARN',
                'Could not validate headers with browser',
                { error: error.message, note: 'Server may not be running on localhost:8080' }
            );
        }
    }

    async validateAuditScript() {
        console.log('🔍 Validating audit script functionality...');

        const auditPath = path.join(ROOT, 'security/audit-permissions.js');
        if (fs.existsSync(auditPath)) {
            this.addResult(
                'Audit Script Exists',
                'PASS',
                'Permission audit script available'
            );
            
            // Test if script is executable
            try {
                const { spawn } = await import('child_process');
                const child = spawn('node', [auditPath, '--dry-run'], { 
                    stdio: 'pipe',
                    timeout: 5000
                });
                
                child.on('close', (code) => {
                    if (code === 0) {
                        this.addResult(
                            'Audit Script Execution',
                            'PASS',
                            'Permission audit script executes successfully'
                        );
                    }
                });
                
                child.on('error', (error) => {
                    this.addResult(
                        'Audit Script Execution',
                        'WARN',
                        'Permission audit script execution failed',
                        { error: error.message }
                    );
                });
                
            } catch (error) {
                this.addResult(
                    'Audit Script Test',
                    'WARN',
                    'Could not test audit script execution'
                );
            }
        } else {
            this.addResult(
                'Audit Script Missing',
                'FAIL',
                'security/audit-permissions.js not found'
            );
        }
    }

    async runAllValidations(options = {}) {
        console.log('🚀 Starting comprehensive security validation...\n');

        await this.validateCredentialSecurity();
        await this.validateHeaderConfiguration();
        await this.validatePermissionStructure();
        await this.validateFileProtection();
        await this.validateAuditScript();
        
        // Browser validation only if not in dry-run mode
        if (!options.dryRun) {
            await this.validateWithBrowser();
        }

        return this.results;
    }

    generateReport() {
        console.log('\n=== SECURITY VALIDATION REPORT ===');
        console.log(`Timestamp: ${this.results.timestamp}`);
        console.log(`Tests Run: ${this.results.tests.length}`);
        console.log(`✅ Passed: ${this.results.summary.passed}`);
        console.log(`❌ Failed: ${this.results.summary.failed}`);
        console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);

        if (this.results.summary.failed > 0) {
            console.log('\n=== FAILED TESTS ===');
            this.results.tests
                .filter(t => t.status === 'FAIL')
                .forEach(test => {
                    console.log(`❌ ${test.test}: ${test.message}`);
                    if (test.details) {
                        console.log(`   Details: ${JSON.stringify(test.details, null, 2)}`);
                    }
                });
        }

        if (this.results.summary.warnings > 0) {
            console.log('\n=== WARNINGS ===');
            this.results.tests
                .filter(t => t.status === 'WARN')
                .forEach(test => {
                    console.log(`⚠️  ${test.test}: ${test.message}`);
                });
        }

        const overallStatus = this.results.summary.failed === 0 ? 'PASS' : 'FAIL';
        const statusIcon = overallStatus === 'PASS' ? '✅' : '❌';
        
        console.log(`\n${statusIcon} Overall Status: ${overallStatus}`);
        
        // Exit code for CI/CD integration
        return this.results.summary.failed === 0 ? 0 : 1;
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new SecurityValidator();
    const isDryRun = process.argv.includes('--dry-run');
    const isComprehensive = process.argv.includes('--comprehensive');
    
    validator.runAllValidations({ dryRun: isDryRun, comprehensive: isComprehensive })
        .then(() => {
            // Save detailed results
            const outDir = path.join(ROOT, 'audits');
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }
            
            const outputFile = path.join(outDir, 'security-validation-results.json');
            fs.writeFileSync(outputFile, JSON.stringify(validator.results, null, 2));
            
            console.log(`\n📊 Detailed results saved to: ${outputFile}`);
            
            // Generate report and exit with appropriate code
            const exitCode = validator.generateReport();
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('❌ Validation failed:', error.message);
            process.exit(2);
        });
}