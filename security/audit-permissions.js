// security/audit-permissions.js
// Automated permission and security configuration scanner
// Praxis Initiative - Security Audit Tool
// Follows pattern: tools/audit-cards.mjs for file processing and reporting

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ----- CONFIG -----
const ROOT = process.cwd();
const SECURITY_FILES = [
  '.htaccess',
  'netlify.toml', 
  '.claude/settings.local.json',
  '.mcp.json',
  'MCP-SETUP.md'
];

// Credential detection patterns
const CREDENTIAL_PATTERNS = [
  /password["'\s]*[:=][\s'"]*([^"'\s\n]{8,})/gi,
  /token["'\s]*[:=][\s'"]*([^"'\s\n]{20,})/gi,
  /key["'\s]*[:=][\s'"]*([^"'\s\n]{20,})/gi,
  /secret["'\s]*[:=][\s'"]*([^"'\s\n]{20,})/gi,
  /api[_-]?key["'\s]*[:=][\s'"]*([^"'\s\n]{20,})/gi,
  // WordPress specific patterns
  /5mu7\s+wpMy\s+7Q8h/gi, // Known exposed WordPress credential
  /WORDPRESS_PASSWORD["'\s]*[:=][\s'"]*([^"'\s\n]{8,})/gi,
  /WP_APP_PASSWORD["'\s]*[:=][\s'"]*([^"'\s\n]{8,})/gi
];

// Security headers for duplication detection
const SECURITY_HEADERS = [
  'X-Frame-Options',
  'X-Content-Type-Options', 
  'X-XSS-Protection',
  'Referrer-Policy',
  'Permissions-Policy',
  'Content-Security-Policy',
  'Strict-Transport-Security'
];

// MCP permission patterns
const MCP_PERMISSION_PATTERNS = [
  /Bash\([^)]*\*[^)]*\)/gi,       // Overly broad bash permissions
  /powershell:\*/gi,               // Broad PowerShell access
  /npm\s+install:\*/gi,           // Broad npm install permissions
  /filesystem:[^"'\s,}]*/gi,      // Filesystem permissions
  /github:[^"'\s,}]*/gi,          // GitHub permissions
  /wordpress:[^"'\s,}]*/gi        // WordPress permissions
];

// ----- UTIL -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Safely parse different configuration file formats
 * @param {string} filePath - Path to config file
 * @returns {object|null} Parsed content or null if failed
 */
function parseConfigFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();
    
    // JSON files
    if (ext === '.json' || basename.endsWith('.json')) {
      try {
        return JSON.parse(content);
      } catch (e) {
        return { _raw_content: content, _parse_error: e.message };
      }
    }
    
    // TOML files (netlify.toml)
    if (ext === '.toml' || basename.includes('.toml')) {
      // Simple TOML header extraction for our use case
      const headers = {};
      const headerMatches = content.match(/\[headers\.values\][\s\S]*?(?=\[|$)/g);
      if (headerMatches) {
        headerMatches.forEach(match => {
          SECURITY_HEADERS.forEach(header => {
            const regex = new RegExp(`${header}\\s*=\\s*["']([^"']+)["']`, 'i');
            const headerMatch = match.match(regex);
            if (headerMatch) {
              headers[header] = headerMatch[1];
            }
          });
        });
      }
      return { 
        _raw_content: content, 
        _type: 'toml',
        detected_headers: headers
      };
    }
    
    // Apache .htaccess files
    if (basename === '.htaccess') {
      const headers = {};
      const headerMatches = content.match(/Header\s+always\s+set\s+([\w-]+)\s+["']([^"']+)["']/gi);
      if (headerMatches) {
        headerMatches.forEach(match => {
          const parts = match.match(/Header\s+always\s+set\s+([\w-]+)\s+["']([^"']+)["']/i);
          if (parts) {
            headers[parts[1]] = parts[2];
          }
        });
      }
      return {
        _raw_content: content,
        _type: 'apache',
        detected_headers: headers
      };
    }
    
    // Markdown and other text files
    return {
      _raw_content: content,
      _type: 'text'
    };
    
  } catch (error) {
    return {
      _raw_content: '',
      _parse_error: error.message
    };
  }
}

/**
 * Scan content for credential exposures
 * @param {string} content - File content to scan
 * @param {string} filePath - File path for context
 * @returns {array} Array of credential exposures found
 */
function scanForCredentials(content, filePath) {
  const exposures = [];
  
  CREDENTIAL_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      exposures.push({
        type: 'credential_exposure',
        file: filePath,
        pattern: pattern.source,
        matched_text: match[0],
        credential_value: match[1] || match[0],
        line_number: content.substring(0, match.index).split('\n').length,
        severity: 'CRITICAL'
      });
    }
  });
  
  return exposures;
}

/**
 * Detect security header duplications across files
 * @param {object} fileContents - Map of file paths to parsed content
 * @returns {array} Array of header duplication issues
 */
function detectHeaderDuplications(fileContents) {
  const duplications = [];
  const headersByFile = {};
  
  // Extract headers from each file
  Object.entries(fileContents).forEach(([filePath, content]) => {
    if (content && content.detected_headers) {
      headersByFile[filePath] = content.detected_headers;
    }
  });
  
  // Find duplications
  SECURITY_HEADERS.forEach(header => {
    const filesWithHeader = [];
    
    Object.entries(headersByFile).forEach(([filePath, headers]) => {
      if (headers[header]) {
        filesWithHeader.push({
          file: filePath,
          value: headers[header]
        });
      }
    });
    
    if (filesWithHeader.length > 1) {
      duplications.push({
        type: 'header_duplication',
        header: header,
        files: filesWithHeader,
        severity: filesWithHeader.some(f => f.value !== filesWithHeader[0].value) ? 'HIGH' : 'MEDIUM'
      });
    }
  });
  
  return duplications;
}

/**
 * Scan for overly broad permission patterns
 * @param {string} content - File content to scan  
 * @param {string} filePath - File path for context
 * @returns {array} Array of permission issues found
 */
function scanPermissionOverlaps(content, filePath) {
  const overlaps = [];
  
  MCP_PERMISSION_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      overlaps.push({
        type: 'permission_overlap',
        file: filePath,
        pattern: pattern.source,
        matched_permission: match[0],
        line_number: content.substring(0, match.index).split('\n').length,
        severity: 'MEDIUM',
        recommendation: 'Consider using more specific permission patterns'
      });
    }
  });
  
  return overlaps;
}

/**
 * Generate security recommendations based on audit results
 * @param {object} auditResults - Complete audit results
 * @returns {array} Array of actionable recommendations
 */
function generateRecommendations(auditResults) {
  const recommendations = [];
  
  // Critical credential exposures
  if (auditResults.credential_exposures.length > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'credential_security',
      action: 'Remove exposed credentials immediately',
      affected_files: auditResults.credential_exposures.map(e => e.file),
      steps: [
        'Move credentials to environment variables',
        'Update configuration files to reference env vars',
        'Rotate exposed credentials if they are live',
        'Add .env to .gitignore if not already present'
      ]
    });
  }
  
  // Header duplications
  if (auditResults.header_duplications.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'configuration_consolidation',
      action: 'Consolidate duplicate security headers',
      affected_files: auditResults.header_duplications.flatMap(d => d.files.map(f => f.file)),
      steps: [
        'Choose single source of truth for each header (Netlify OR Apache)',
        'Move comprehensive CSP policy to chosen platform',
        'Remove duplicate headers from secondary platform',
        'Test header delivery in both development and production'
      ]
    });
  }
  
  // Permission overlaps
  if (auditResults.permission_overlaps.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'permission_management',
      action: 'Implement least privilege permissions',
      affected_files: auditResults.permission_overlaps.map(p => p.file),
      steps: [
        'Replace wildcard permissions with specific tool permissions',
        'Create role-based permission structure',
        'Centralize MCP permission management',
        'Regular permission audits'
      ]
    });
  }
  
  return recommendations;
}

/**
 * Main audit function
 */
async function auditPermissions() {
  console.log('🔒 Starting Security Configuration Audit...');
  console.log('📍 Scanning files for credential exposures, header duplications, and permission overlaps\\n');
  
  const auditResults = {
    scan_timestamp: new Date().toISOString(),
    files_scanned: [],
    credential_exposures: [],
    header_duplications: [],
    permission_overlaps: [],
    recommendations: [],
    summary: {}
  };
  
  const fileContents = {};
  
  // Scan each security configuration file
  for (const filePath of SECURITY_FILES) {
    const fullPath = path.join(ROOT, filePath);
    
    try {
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  ${filePath} - File not found (skipping)`);
        auditResults.files_scanned.push({
          file: filePath,
          status: 'not_found',
          issues: []
        });
        continue;
      }
      
      console.log(`🔍 Scanning ${filePath}...`);
      const parsedContent = parseConfigFile(fullPath);
      fileContents[filePath] = parsedContent;
      
      if (!parsedContent) {
        console.log(`❌ ${filePath} - Failed to parse`);
        auditResults.files_scanned.push({
          file: filePath,
          status: 'parse_failed',
          issues: []
        });
        continue;
      }
      
      const rawContent = parsedContent._raw_content || '';
      const fileIssues = [];
      
      // Scan for credentials
      const credentialExposures = scanForCredentials(rawContent, filePath);
      if (credentialExposures.length > 0) {
        console.log(`  ⛔ Found ${credentialExposures.length} credential exposure(s)`);
        auditResults.credential_exposures.push(...credentialExposures);
        fileIssues.push(...credentialExposures);
      }
      
      // Scan for permission overlaps
      const permissionOverlaps = scanPermissionOverlaps(rawContent, filePath);
      if (permissionOverlaps.length > 0) {
        console.log(`  ⚠️  Found ${permissionOverlaps.length} permission overlap(s)`);
        auditResults.permission_overlaps.push(...permissionOverlaps);
        fileIssues.push(...permissionOverlaps);
      }
      
      if (fileIssues.length === 0) {
        console.log(`  ✅ No issues found`);
      }
      
      auditResults.files_scanned.push({
        file: filePath,
        status: 'scanned',
        issues: fileIssues
      });
      
    } catch (error) {
      console.log(`❌ ${filePath} - Error: ${error.message}`);
      auditResults.files_scanned.push({
        file: filePath,
        status: 'error',
        error: error.message,
        issues: []
      });
    }
  }
  
  // Detect header duplications across all files
  console.log('\\n🔍 Analyzing security header duplications...');
  const headerDuplications = detectHeaderDuplications(fileContents);
  if (headerDuplications.length > 0) {
    console.log(`  ⚠️  Found ${headerDuplications.length} header duplication(s)`);
    auditResults.header_duplications = headerDuplications;
  } else {
    console.log(`  ✅ No header duplications found`);
  }
  
  // Generate recommendations
  auditResults.recommendations = generateRecommendations(auditResults);
  
  // Create summary
  auditResults.summary = {
    total_files_scanned: auditResults.files_scanned.length,
    files_with_issues: auditResults.files_scanned.filter(f => f.issues?.length > 0).length,
    total_credential_exposures: auditResults.credential_exposures.length,
    total_header_duplications: auditResults.header_duplications.length,
    total_permission_overlaps: auditResults.permission_overlaps.length,
    overall_security_rating: auditResults.credential_exposures.length > 0 ? 'CRITICAL' :
                              auditResults.header_duplications.length > 0 ? 'HIGH' : 
                              auditResults.permission_overlaps.length > 0 ? 'MEDIUM' : 'GOOD'
  };
  
  return auditResults;
}

// Main execution (following audit-cards.mjs pattern)
(async () => {
  try {
    const auditResults = await auditPermissions();
    
    // Create audits directory and output results
    const outDir = path.join(ROOT, 'audits');
    fs.mkdirSync(outDir, { recursive: true });
    
    const outputFile = path.join(outDir, 'permission-audit-results.json');
    fs.writeFileSync(outputFile, JSON.stringify(auditResults, null, 2), 'utf8');
    
    // Display summary
    console.log('\\n=== SECURITY AUDIT SUMMARY ===');
    console.log(`Files scanned: ${auditResults.summary.total_files_scanned}`);
    console.log(`Files with issues: ${auditResults.summary.files_with_issues}`);
    console.log(`Credential exposures: ${auditResults.summary.total_credential_exposures} ⛔`);
    console.log(`Header duplications: ${auditResults.summary.total_header_duplications} ⚠️`);
    console.log(`Permission overlaps: ${auditResults.summary.total_permission_overlaps} ⚠️`);
    console.log(`Overall security rating: ${auditResults.summary.overall_security_rating}`);
    
    if (auditResults.recommendations.length > 0) {
      console.log('\\n=== PRIORITY RECOMMENDATIONS ===');
      auditResults.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.priority}] ${rec.action}`);
        rec.steps.forEach(step => console.log(`   • ${step}`));
      });
    }
    
    console.log(`\\n📊 Detailed results: ${outputFile}`);
    
    // Exit with error code if critical issues found
    if (auditResults.credential_exposures.length > 0) {
      console.log('\\n⛔ CRITICAL: Credential exposures detected. Immediate action required!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(2);
  }
})();