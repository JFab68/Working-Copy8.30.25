# Consolidated Security Headers Documentation

**Single Source of Truth for Praxis Initiative Security Configuration**

This document serves as the authoritative reference for all HTTP security headers across Netlify and Apache deployments, eliminating configuration duplication and ensuring consistent security posture.

## Current State Analysis

### Duplicate Headers Identified

The following security headers are currently configured in **both** `netlify.toml` and `.htaccess`, creating maintenance overhead and potential conflicts:

- X-Frame-Options
- X-Content-Type-Options  
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### Unique Configurations

| Platform | Unique Headers | Notes |
|----------|----------------|--------|
| `.htaccess` | Content-Security-Policy | Comprehensive CSP with 'unsafe-inline' allowances |
| `netlify.toml` | Cache-Control (static assets) | Asset-specific caching strategies |

## Consolidated Security Header Strategy

### Primary Platform: Netlify (netlify.toml)

**Rationale**: Netlify is the production deployment platform and handles all live traffic. Consolidating headers here ensures consistent delivery across all environments.

| Header | Value | Purpose | Justification |
|--------|-------|---------|---------------|
| **X-Frame-Options** | `DENY` | Prevent clickjacking attacks | Blocks iframe embedding completely - appropriate for main site content |
| **X-Content-Type-Options** | `nosniff` | Prevent MIME-type confusion | Forces browsers to respect declared content types |
| **X-XSS-Protection** | `1; mode=block` | Legacy XSS protection | Browser fallback protection (CSP is primary defense) |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Control referrer information | Balances analytics needs with privacy protection |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=()` | Disable sensitive browser APIs | Prevents unauthorized access to user devices |
| **Content-Security-Policy** | [See Consolidated CSP](#consolidated-csp-policy) | Comprehensive XSS protection | Primary defense against code injection attacks |
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains` | Enforce HTTPS | Prevents downgrade attacks (to be added) |

### Secondary Platform: Apache (.htaccess)

**Scope**: Minimal configuration for file protection and fallback compatibility only.

**Retained Functions**:
- Sensitive file protection (`.htaccess`, `.log`, `README.md`, etc.)
- URL rewriting for clean URLs (backup to Netlify redirects)
- Basic compression and caching (when not served by Netlify)

**Removed Functions**:
- All security headers (migrated to Netlify)
- CSP policy (consolidated in Netlify)
- Cache control for static assets (handled by Netlify)

## Consolidated CSP Policy

### Current .htaccess CSP Analysis
```
Content-Security-Policy: default-src 'self'; 
script-src 'self' 'unsafe-inline' https://js.givebutter.com https://widgets.givebutter.com https://fonts.googleapis.com https://cdnjs.cloudflare.com; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; 
font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; 
img-src 'self' data: https:; 
connect-src 'self' https://js.givebutter.com;
```

### Consolidated CSP for Netlify

**Target CSP** (balances security with functionality):
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.givebutter.com https://widgets.givebutter.com https://fonts.googleapis.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://js.givebutter.com; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests
```

**CSP Enhancements**:
- `form-action 'self'` - Restrict form submissions
- `base-uri 'self'` - Prevent base tag injection
- `object-src 'none'` - Block plugins/objects
- `frame-ancestors 'none'` - Additional clickjacking protection
- `upgrade-insecure-requests` - Force HTTPS for mixed content

### Future CSP Optimization

**Phase 1** (Immediate): Implement consolidated CSP with current 'unsafe-inline'
**Phase 2** (Future): Remove 'unsafe-inline' by implementing nonces or hashes

## Implementation Plan

### Phase 1: Header Consolidation (Current Sprint)

1. **Modify `netlify.toml`**:
   - Add consolidated CSP policy from .htaccess
   - Add missing HSTS header
   - Maintain existing caching strategies

2. **Modify `.htaccess`**:
   - Remove all duplicate security headers
   - Keep file protection rules
   - Keep URL rewriting (backup to Netlify)
   - Add comment explaining header delegation to Netlify

3. **Validation**:
   - Test header delivery in both dev and prod environments
   - Confirm no functionality regressions
   - Verify CSP policy effectiveness

### Phase 2: Security Enhancement (Future)

1. **CSP Hardening**:
   - Implement nonce-based inline script/style protection
   - Remove 'unsafe-inline' directives
   - Add report-uri for CSP violation monitoring

2. **Additional Headers**:
   - Consider Cross-Origin-Embedder-Policy for advanced isolation
   - Evaluate Cross-Origin-Resource-Policy for asset protection
   - Add security.txt for vulnerability disclosure

## Security Header Testing

### Validation Commands

```bash
# Test header delivery
curl -I https://praxisinitiative.org/ | grep -E "(X-Frame-Options|Content-Security-Policy|X-Content-Type-Options)"

# Test CSP effectiveness  
curl -H "Accept: text/html" https://praxisinitiative.org/ | grep -o "script-src[^;]*"

# Cross-browser header testing
npx playwright eval "
(async () => {
  for (const browserType of ['chromium', 'firefox', 'webkit']) {
    const browser = await playwright[browserType].launch();
    const page = await browser.newPage();
    const response = await page.goto('https://praxisinitiative.org/');
    const headers = response.headers();
    console.log(\`\${browserType}: CSP = \${headers['content-security-policy'] ? 'Present' : 'Missing'}\`);
    await browser.close();
  }
})();
"
```

### Security Testing Tools

- **[Mozilla Observatory](https://observatory.mozilla.org/)**: Comprehensive header analysis
- **[SecurityHeaders.com](https://securityheaders.com/)**: Quick header scan and grading
- **[CSP Evaluator](https://csp-evaluator.withgoogle.com/)**: CSP policy analysis
- **Custom Script**: `node security/audit-permissions.js` for ongoing monitoring

## Maintenance Protocol

### Regular Audits

1. **Monthly**: Run `node security/audit-permissions.js` to detect configuration drift
2. **Quarterly**: Manual review of CSP policy for new dependencies
3. **On Deployment**: Automated header validation in CI/CD pipeline

### Change Management

1. **All header changes require**:
   - Documentation update in this file
   - Testing across multiple browsers
   - Validation that existing functionality is preserved

2. **Emergency Security Updates**:
   - Can be deployed directly to Netlify configuration
   - Must be documented here within 24 hours
   - Requires post-deployment validation

## Platform-Specific Configuration Details

### Netlify Configuration (`netlify.toml`)

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.givebutter.com https://widgets.givebutter.com https://fonts.googleapis.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://js.givebutter.com; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

### Apache Configuration (`.htaccess`)

```apache
# Security headers managed by Netlify - see security/consolidated-headers.md
# This file handles file protection and URL rewriting only

# Prevent access to sensitive files
<Files ".htaccess">
    Order allow,deny
    Deny from all
</Files>

<Files "*.log">
    Order allow,deny
    Deny from all
</Files>

# Additional file protections...
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|---------|------------|
| Header delivery failure | Low | High | Dual platform fallback, automated monitoring |
| CSP policy too restrictive | Medium | Medium | Phased rollout, comprehensive testing |
| Configuration drift | Medium | Low | Regular audits, documentation updates |
| New security vulnerability | Low | High | Security header testing tools, monitoring |

---

**Document Maintainer**: DevOps Team  
**Last Updated**: [Current Date]  
**Next Review**: [Date + 3 months]  
**Related Documents**:
- `PRPs/permissions-audit-cleanup.md` - Original PRP implementation
- `audits/permission-audit-results.json` - Latest audit results
- `security/mcp-permissions.json` - MCP server permission management