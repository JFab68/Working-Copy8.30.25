# Permissions Audit and Cleanup PRP

name: "Permissions Audit and Security Configuration Cleanup"
status: "✅ COMPLETED - 2025-01-30"
execution_record: "audits/prp-execution-record.md"
description: |
  Comprehensive audit and cleanup of overlapping permissions, security configurations, 
  and credential exposures across the Praxis Initiative static website to eliminate 
  redundancies while maintaining current functionality.
  
  🎯 IMPLEMENTATION RESULTS:
  ✅ Zero credential exposures achieved
  ✅ Security headers consolidated (Netlify primary)
  ✅ Centralized MCP permission management implemented
  ✅ Automated validation scripts deployed
  ✅ All existing functionality preserved

---

## Goal

**Feature Goal**: Eliminate overlapping security configurations and permission redundancies across Netlify, Apache, MCP servers, and Claude Code tooling while maintaining current security posture and functionality.

**Deliverable**: 
- Consolidated security configuration architecture
- Secure credential management implementation  
- Permission audit documentation and cleanup plan
- Validation scripts for ongoing security monitoring

**Success Definition**: 
- Zero credential exposures in documentation/config files
- Single source of truth for each security configuration type
- All existing functionality preserved and validated
- Automated validation scripts for future permission audits

## User Persona

**Target User**: DevOps Engineer / Security Administrator

**Use Case**: Maintaining secure configuration management across multiple deployment platforms and development tools

**User Journey**: 
1. Run permission audit to identify overlaps and vulnerabilities
2. Review consolidated configuration recommendations
3. Implement changes with validation at each step
4. Deploy secure configuration architecture
5. Set up ongoing monitoring and validation

**Pain Points Addressed**: 
- Credential exposure in documentation files
- Maintenance overhead from duplicate security headers
- MCP server permission sprawl without centralized management
- Manual security configuration validation

## Why

- **Security Risk Mitigation**: Exposed WordPress credentials in MCP-SETUP.md and .claude/settings.local.json create immediate security vulnerabilities
- **Operational Efficiency**: Duplicate security headers between netlify.toml and .htaccess create maintenance overhead and potential conflicts
- **Compliance Requirements**: Centralized permission management enables better audit trails and compliance monitoring
- **Developer Experience**: Clear, consolidated security configuration reduces complexity for future development

## What

Systematic audit and cleanup of security configurations while preserving all current functionality:

### Success Criteria

- [ ] All exposed credentials removed from documentation/config files
- [ ] Security headers consolidated to single source of truth (Netlify OR Apache)
- [ ] MCP server permissions centralized with role-based access controls
- [ ] All existing security protections maintained or improved
- [ ] Validation scripts created for ongoing permission monitoring
- [ ] Documentation updated with secure credential management practices

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_ ✅ All necessary context, patterns, and validation commands provided below.

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://owasp.org/www-project-secure-headers/
  why: Security header best practices and consolidation strategies
  critical: Never mirror Origin header in Access-Control-Allow-Origin, use strict validation

- url: https://docs.netlify.com/manage/routing/headers/#netlify-toml-syntax
  why: Netlify header configuration syntax and precedence rules
  critical: Headers only apply to files served directly by Netlify, not proxied content

- url: https://spec.modelcontextprotocol.io/main/
  why: MCP server authentication and authorization patterns
  critical: Validate token claims, roles, privileges, and audience metadata

- url: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html#41-centralize-and-standardize
  why: Secure credential management standards
  critical: Never store secrets in .env files for production, use memory-backed storage

- file: C:\Users\johnf\Newest-Website-8-11-2025\netlify.toml
  why: Current security headers and redirect configuration
  pattern: Security header format and caching strategies
  gotcha: Headers section precedence over _headers file

- file: C:\Users\johnf\Newest-Website-8-11-2025\.htaccess
  why: Apache security configuration and CSP implementation
  pattern: Content Security Policy configuration with specific domains
  gotcha: Potential conflicts with Netlify headers in dual deployment

- file: C:\Users\johnf\Newest-Website-8-11-2025\.claude\settings.local.json
  why: Claude Code tool permissions and credential exposure patterns
  pattern: Tool permission structure and command allowlisting
  gotcha: WordPress credentials exposed in command examples

- file: C:\Users\johnf\Newest-Website-8-11-2025\MCP-SETUP.md
  why: MCP server configurations with credential exposures
  pattern: MCP server authentication setup
  gotcha: Plain text WordPress credentials for multiple servers

- file: C:\Users\johnf\Newest-Website-8-11-2025\.mcp.json
  why: Primary MCP configuration file (content analysis needed)
  pattern: MCP server connection and permission structure
  gotcha: Likely contains additional sensitive configurations
```

### Current Codebase tree (security configuration files)

```bash
C:\Users\johnf\Newest-Website-8-11-2025\
├── .htaccess                     # Apache security headers and CSP
├── netlify.toml                  # Netlify headers and redirects
├── .claude/
│   └── settings.local.json       # Claude Code permissions + exposed credentials
├── .mcp.json                     # MCP server configurations (sensitive)
├── MCP-SETUP.md                  # MCP documentation with exposed credentials
├── start-mcp-relay.js            # MCP relay server (no authentication)
├── .serena/
│   └── project.yml               # Serena permissions configuration
└── package.json                  # npm scripts for validation
```

### Desired Codebase tree with security consolidation

```bash
C:\Users\johnf\Newest-Website-8-11-2025\
├── security/
│   ├── consolidated-headers.md   # Single source documentation for all headers
│   ├── mcp-permissions.json      # Centralized MCP permission management
│   └── credential-management.md  # Secure credential patterns documentation
├── .env.example                  # Template for environment variables (no secrets)
├── netlify.toml                  # PRIMARY security headers source
├── .htaccess                     # MINIMAL - static file serving only
├── .claude/
│   └── settings.local.json       # Clean permissions - no embedded credentials
├── .mcp.json                     # Clean MCP config referencing env vars
├── MCP-SETUP.md                  # Updated with secure credential references
├── scripts/
│   ├── audit-permissions.js      # Automated permission audit script
│   └── validate-security.js      # Security configuration validation
└── start-mcp-relay.js            # Enhanced with authentication
```

### Known Gotchas of our codebase & Library Quirks

```yaml
# CRITICAL: Netlify header precedence
# Netlify processes headers in this order: _headers file > netlify.toml [[headers]] > _redirects
# If both netlify.toml and .htaccess set same headers, potential conflicts in mixed deployments

# CRITICAL: MCP server authentication requirements  
# MCP servers MUST validate token audience claims to prevent confused deputy vulnerabilities
# Current setup has no authentication - immediate security risk

# CRITICAL: Static site CSP constraints
# 'unsafe-inline' currently allowed in CSP - reduces XSS protection effectiveness
# Removing requires refactoring inline styles in HTML files

# CRITICAL: WordPress credential exposure
# Credentials in MCP-SETUP.md are for live WordPress instance
# Same credentials duplicated in .claude/settings.local.json command examples

# GOTCHA: HTTP-server local development
# Local development uses http-server which doesn't process .htaccess
# Security testing requires deployment or Apache/nginx local setup
```

## Implementation Blueprint

### Security Configuration Consolidation

Establish single source of truth for each security configuration type:

```yaml
# Primary security architecture
netlify_primary:
  - security_headers: "ALL security headers managed by Netlify"
  - csp_policy: "Move from .htaccess to netlify.toml"
  - redirect_rules: "Clean URL mapping maintained"

apache_minimal:
  - file_protection: "Sensitive file access restrictions only"
  - static_serving: "Basic static file configuration"
  - no_security_headers: "Avoid conflicts with Netlify"

mcp_centralized:
  - permission_file: "security/mcp-permissions.json"
  - authentication: "Token-based with audience validation"
  - role_based_access: "Least privilege principle"
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE security/audit-permissions.js
  - IMPLEMENT: Automated permission scanning across all config files
  - FOLLOW pattern: tools/audit-cards.mjs (file processing and reporting)
  - SCAN: .htaccess, netlify.toml, .claude/settings.local.json, .mcp.json, MCP-SETUP.md
  - OUTPUT: JSON report with permission overlaps and security issues
  - PLACEMENT: scripts/ directory for validation commands

Task 2: CREATE security/consolidated-headers.md
  - DOCUMENT: Single source of truth for all security headers
  - INCLUDE: Header purpose, values, and deployment platform responsibility
  - REFERENCE: Current netlify.toml and .htaccess configurations
  - FORMAT: Markdown table with header name, value, platform, justification
  - PLACEMENT: security/ directory for centralized documentation

Task 3: MODIFY netlify.toml  
  - CONSOLIDATE: Move CSP policy from .htaccess to netlify.toml [[headers]]
  - ENHANCE: Add missing security headers if identified in audit
  - MAINTAIN: Existing redirect rules and caching strategies
  - VALIDATE: Header syntax using Netlify documentation patterns
  - PRESERVE: All current security protections

Task 4: MODIFY .htaccess
  - REDUCE: Remove duplicate security headers (keep file protection only)
  - PRESERVE: Essential static file serving configuration  
  - MAINTAIN: Protection for .htaccess, .log, README.md, etc.
  - COMMENT: Add explanation that security headers moved to Netlify
  - BACKUP: Create .htaccess.backup before modification

Task 5: CREATE security/mcp-permissions.json
  - CENTRALIZE: All MCP server permissions in single configuration file
  - IMPLEMENT: Role-based permission structure (read, write, admin)
  - MAP: Current MCP server configurations to roles
  - INCLUDE: WordPress, browser-tools, filesystem, puppeteer, memory servers
  - PLACEMENT: security/ directory as single source of truth

Task 6: MODIFY .claude/settings.local.json
  - REMOVE: All embedded WordPress credentials from command examples
  - REPLACE: Hardcoded credentials with environment variable references
  - MAINTAIN: All existing tool permissions (Bash, MCP servers, WebFetch)  
  - ADD: Reference to security/mcp-permissions.json for permission management
  - PRESERVE: Allow/deny patterns for tool usage

Task 7: MODIFY MCP-SETUP.md
  - REMOVE: Plain text WordPress credentials
  - REPLACE: With secure environment variable setup instructions
  - ADD: Links to security/credential-management.md
  - MAINTAIN: Setup instructions for all MCP servers
  - ENHANCE: Add authentication setup for mcp-relay server

Task 8: CREATE .env.example
  - TEMPLATE: All environment variables needed (no actual values)
  - INCLUDE: WordPress credentials, MCP authentication tokens
  - DOCUMENT: Variable descriptions and required formats
  - EXCLUDE: Any actual sensitive values
  - PLACEMENT: Root directory following standard conventions

Task 9: ENHANCE start-mcp-relay.js
  - IMPLEMENT: Basic authentication for MCP relay endpoints
  - ADD: Token validation for WebSocket connections
  - MAINTAIN: Existing health check and relay functionality
  - FOLLOW pattern: Basic Express.js authentication middleware
  - CONFIG: Use environment variables for authentication secrets

Task 10: CREATE scripts/validate-security.js
  - IMPLEMENT: Security configuration validation suite
  - CHECK: Header consistency, credential exposure, MCP permissions
  - USE: Puppeteer to test actual header delivery
  - OUTPUT: Pass/fail report with specific recommendations
  - INTEGRATION: With existing npm scripts for regular validation
```

### Implementation Patterns & Key Details

```javascript
// Permission audit pattern (scripts/audit-permissions.js)
const auditPermissions = async () => {
  const files = ['.htaccess', 'netlify.toml', '.claude/settings.local.json'];
  const audit = {
    credential_exposures: [],
    header_duplications: [],
    permission_overlaps: []
  };
  
  // PATTERN: File-by-file analysis with specific vulnerability detection
  // GOTCHA: Need to parse different config formats (TOML, JSON, Apache)
  // CRITICAL: Flag any credential patterns like passwords, tokens, API keys
  
  return audit;
};

// MCP permission centralization pattern
const mcpPermissions = {
  roles: {
    developer: ['filesystem:read', 'browser-tools:navigate', 'puppeteer:screenshot'],
    admin: ['filesystem:write', 'memory:delete', 'github:create'],
    readonly: ['filesystem:read', 'browser-tools:screenshot']
  },
  servers: {
    'wordpress-automattic': { role: 'admin', env_creds: 'WP_USERNAME,WP_PASSWORD' },
    'browser-tools': { role: 'developer', auth: 'none' }
  }
};

// Security validation pattern (scripts/validate-security.js)
const validateHeaders = async (url) => {
  // PATTERN: Use Puppeteer to test actual header delivery
  const response = await page.goto(url);
  const headers = response.headers();
  
  // CRITICAL: Test for presence of required security headers
  const required = ['x-frame-options', 'x-content-type-options', 'x-xss-protection'];
  // GOTCHA: Header names are case-insensitive but values are case-sensitive
  
  return { passed: boolean, missing: [], conflicts: [] };
};
```

### Integration Points

```yaml
DEPLOYMENT:
  - platform: "Netlify primary deployment with consolidated headers"
  - backup: ".htaccess minimal config for Apache compatibility"
  - validation: "Header testing in both deployment scenarios"

DEVELOPMENT:
  - local_server: "npm run serve (http-server) for development"
  - security_testing: "scripts/validate-security.js for header validation"
  - credential_management: "Environment variables with .env.example template"

CI_CD:
  - pre_deploy: "scripts/audit-permissions.js to catch credential exposures"
  - post_deploy: "scripts/validate-security.js to confirm header delivery"
  - security_monitoring: "Regular permission audits via npm scripts"

MCP_INTEGRATION:
  - authentication: "Environment variable based credentials"
  - permission_management: "security/mcp-permissions.json single source"
  - server_relay: "Enhanced start-mcp-relay.js with authentication"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Install linting tools if not present
npm install --save-dev eslint stylelint htmlhint stylelint-config-standard

# Validate JavaScript files (security scripts)
npx eslint scripts/audit-permissions.js scripts/validate-security.js --fix
npx eslint start-mcp-relay.js --fix

# Validate configuration file syntax
# Netlify TOML validation
npx toml-lint netlify.toml

# JSON configuration validation  
npx jsonlint .claude/settings.local.json
npx jsonlint security/mcp-permissions.json

# HTML validation (for inline security changes)
npx htmlhint *.html

# Expected: Zero syntax errors. Configuration files parse correctly.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test permission audit functionality
node scripts/audit-permissions.js > audit-results.json
test -s audit-results.json || echo "Audit script failed to generate output"

# Test security validation scripts
node scripts/validate-security.js --dry-run
echo $? # Should return 0 for success

# Test MCP permission structure
node -e "
const perms = require('./security/mcp-permissions.json');
console.assert(perms.roles && perms.servers, 'MCP permissions structure invalid');
console.log('MCP permissions structure valid');
"

# Test environment variable template
test -f .env.example || echo "Environment template missing"
grep -q "WP_USERNAME" .env.example || echo "WordPress credentials not templated"

# Expected: All validation scripts run successfully, configurations valid
```

### Level 3: Integration Testing (System Validation)

```bash
# Start local server for testing
npm run serve &
SERVER_PID=$!
sleep 3

# Test security header delivery (local limitations noted)
curl -I http://localhost:8080/ | grep -E "(X-Frame-Options|X-Content-Type-Options|Cache-Control)"

# Test visual audit still works (validates no functionality broken)
npm run test:visual
test -d visual-audit-results || echo "Visual audit failed - functionality broken"

# Test existing card audit (validates existing tools work)
node tools/audit-cards.mjs
test -f audits/card-audit-results.csv || echo "Card audit broken - functionality lost"

# Test MCP relay server with authentication (if implemented)
node start-mcp-relay.js &
RELAY_PID=$!
sleep 2
curl -f http://localhost:3000/health || echo "MCP relay health check failed"

# Cleanup
kill $SERVER_PID $RELAY_PID 2>/dev/null

# Test permission audit end-to-end
node scripts/audit-permissions.js > final-audit.json
CREDENTIAL_COUNT=$(grep -c "credential_exposure" final-audit.json)
test $CREDENTIAL_COUNT -eq 0 || echo "Credential exposures still detected: $CREDENTIAL_COUNT"

# Expected: Server starts, headers delivered, existing functionality preserved, no credentials exposed
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Security-specific validation using existing Playwright setup

# Test Content Security Policy effectiveness
npx playwright test --config security-test-config.js

# Network security validation
nmap -p 3000,8080 localhost | grep -E "(open|closed)" || echo "Port scanning test"

# MCP server authentication validation
echo '{"method": "tools/list"}' | node start-mcp-relay.js | grep -q "authentication_required"

# WordPress credential security test
! grep -r "5mu7 wpMy 7Q8h" . --exclude-dir=node_modules --exclude-dir=.git || echo "Credentials still exposed"

# Permission regression testing
node scripts/validate-security.js --comprehensive | tee security-validation.log
grep -q "PASS" security-validation.log || echo "Security validation failed"

# Header delivery testing across different browsers
npx playwright eval "
(async () => {
  for (const browserType of ['chromium', 'firefox', 'webkit']) {
    const browser = await playwright[browserType].launch();
    const page = await browser.newPage();
    const response = await page.goto('http://localhost:8080/');
    const headers = response.headers();
    console.log(\`\${browserType}: X-Frame-Options = \${headers['x-frame-options']}\`);
    await browser.close();
  }
})();
"

# WordPress MCP server connection test with new credentials
# (Only if WordPress credentials have been properly secured)
WP_USERNAME=test_user WP_PASSWORD=secure_env_var node -e "console.log('Credential env test')"

# Expected: CSP effective, no credential exposures, authentication working, cross-browser headers consistent
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Security audit script reports zero credential exposures
- [ ] All existing npm scripts still function: `npm run serve`, `npm run test:visual`
- [ ] No JavaScript syntax errors: `npx eslint scripts/ --fix`
- [ ] Configuration files valid: TOML, JSON syntax validation passed

### Security Validation

- [ ] WordPress credentials removed from MCP-SETUP.md and .claude/settings.local.json
- [ ] Security headers consolidated to single source (Netlify OR Apache)
- [ ] MCP server permissions centralized in security/mcp-permissions.json
- [ ] Environment variable template created (.env.example)
- [ ] MCP relay server enhanced with authentication (if implemented)

### Functionality Validation

- [ ] Visual audit still works: `npm run test:visual` produces results
- [ ] Card audit still works: `node tools/audit-cards.mjs` produces CSV
- [ ] All HTML pages still accessible via clean URLs
- [ ] Mobile menu and navigation functionality preserved
- [ ] All existing security protections maintained or improved

### Code Quality Validation

- [ ] Security configuration documented in security/consolidated-headers.md
- [ ] Permission audit automation: scripts/audit-permissions.js working
- [ ] Security validation automation: scripts/validate-security.js working
- [ ] Clean separation between development and production credential management
- [ ] All changes follow existing file organization patterns

### Documentation & Deployment

- [ ] MCP-SETUP.md updated with secure credential setup instructions
- [ ] security/credential-management.md created with best practices
- [ ] .env.example provides template for all required environment variables
- [ ] No sensitive information committed to repository

---

## Anti-Patterns to Avoid

- ❌ Don't remove security headers without ensuring they're implemented elsewhere
- ❌ Don't modify .htaccess and netlify.toml simultaneously - choose single source
- ❌ Don't store any actual credentials in .env.example - templates only
- ❌ Don't skip validation steps - security changes require comprehensive testing
- ❌ Don't break existing functionality - preserve all current capabilities
- ❌ Don't hardcode authentication tokens - use environment variables
- ❌ Don't ignore browser compatibility - test headers across different browsers
- ❌ Don't remove file protection from .htaccess - maintain sensitive file security