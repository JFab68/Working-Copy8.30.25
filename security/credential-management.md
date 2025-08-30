# Secure Credential Management Guide

**Praxis Initiative - Security Best Practices Implementation**

This document provides comprehensive guidance on secure credential management practices following the successful permissions audit and cleanup implementation.

## Implementation Status

✅ **COMPLETED**: PRP permissions-audit-cleanup.md executed successfully on 2025-01-30

### Security Improvements Delivered

- **Credential Exposures Eliminated**: All hardcoded WordPress credentials removed
- **Environment Variable System**: Comprehensive .env-based credential management
- **Configuration Consolidated**: Single source of truth established for security headers
- **Permission Management Centralized**: Role-based access control implemented

## Environment Variable Management

### Setup Process

1. **Copy Template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure Credentials**:
   ```bash
   # Edit .env with your actual values
   nano .env  # or your preferred editor
   ```

3. **Verify Configuration**:
   ```bash
   node security/audit-permissions.js
   ```

### Required Environment Variables

| Variable | Purpose | Format | Security Level |
|----------|---------|--------|----------------|
| `WORDPRESS_URL` | WordPress site URL | `https://domain.com` | Low |
| `WORDPRESS_USERNAME` | WordPress admin user | `username` | Medium |
| `WORDPRESS_PASSWORD` | WordPress app password | `abcd efgh ijkl mnop` | **CRITICAL** |
| `WP_APP_USER` | Elementor MCP user | `username` | Medium |
| `WP_APP_PASSWORD` | Elementor MCP password | `abcd efgh ijkl mnop` | **CRITICAL** |
| `MCP_AUTH_TOKEN` | MCP relay authentication | `base64-encoded-token` | **CRITICAL** |
| `GITHUB_TOKEN` | GitHub API access | `ghp_xxxx` | **CRITICAL** |

### WordPress Application Password Setup

WordPress application passwords provide secure, revocable access without exposing main account credentials:

1. **Access WordPress Admin**: Log into WordPress dashboard
2. **Navigate to Profile**: Users → Your Profile → Application Passwords section
3. **Create Application Password**:
   - Name: "Praxis MCP Integration"
   - Click "Add New Application Password"
4. **Copy Generated Password**: Format: `abcd efgh ijkl mnop` (spaces included)
5. **Use in Environment Variables**: Both `WORDPRESS_PASSWORD` and `WP_APP_PASSWORD`

**Security Benefits**:
- Revocable without changing main password
- Limited scope (API access only)
- Activity trackable in WordPress logs

### Token Generation Best Practices

**MCP Authentication Token**:
```bash
# Generate secure random token (32+ characters)
openssl rand -base64 32

# Alternative with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**GitHub Personal Access Token**:
1. GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Scopes: `repo`, `workflow`, `write:packages` (as needed)
4. Copy token immediately (shown only once)

## Security Policies

### Credential Rotation Schedule

| Credential Type | Rotation Frequency | Method |
|-----------------|-------------------|--------|
| WordPress App Passwords | 90 days | Revoke old, generate new in WordPress |
| MCP Auth Tokens | 30 days | Generate new random token |
| GitHub Tokens | 90 days | Generate new in GitHub settings |

### Access Control Matrix

Based on `security/mcp-permissions.json` role definitions:

| Role | WordPress Access | GitHub Access | MCP Admin | File System |
|------|-----------------|---------------|-----------|-------------|
| **readonly** | ❌ | ❌ | ❌ | Read only |
| **developer** | ❌ | ❌ | Limited | Read/List |
| **admin** | ✅ | ✅ | ✅ | Full access |

### Environment-Specific Configuration

**Development Environment**:
- Use separate WordPress site or staging environment
- Generate dedicated application passwords
- Lower-privilege GitHub tokens

**Production Environment**:
- Live site credentials with full privileges
- Automated credential rotation via secrets manager
- Enhanced monitoring and alerting

## Security Monitoring

### Automated Auditing

**Daily Checks**:
```bash
# Check for credential exposures
node security/audit-permissions.js

# Validate security configuration
node scripts/validate-security.js --comprehensive
```

**Weekly Reviews**:
- Review MCP server logs for unauthorized access attempts
- Validate environment variable configurations
- Check WordPress application password usage logs

### Alert Triggers

**Critical Alerts** (Immediate Action Required):
- Hardcoded credentials detected in files
- Failed authentication attempts exceeding threshold
- Unauthorized permission escalations

**Warning Alerts** (Review Required):
- Environment variables missing or misconfigured
- Permission overlaps detected
- Credential rotation approaching due date

## Incident Response

### Credential Compromise Response

1. **Immediate Actions**:
   - Revoke compromised WordPress application password
   - Generate new MCP authentication token
   - Rotate affected GitHub tokens

2. **Investigation**:
   - Check WordPress admin activity logs
   - Review MCP server access logs
   - Scan for unauthorized repository access

3. **Recovery**:
   - Update environment variables with new credentials
   - Test all MCP server connections
   - Document incident and lessons learned

### Configuration Drift Response

When `security/audit-permissions.js` detects issues:

1. **Assess Severity**: Critical (credentials) vs. Medium (permissions) vs. Low (documentation)
2. **Isolate Changes**: Determine what configuration changed and when
3. **Restore Security**: Apply fixes following this guide
4. **Update Documentation**: Record changes and update procedures

## Integration with Existing Systems

### MCP Server Integration

All MCP servers now reference environment variables:

```json
{
  "env": {
    "WORDPRESS_URL": "${WORDPRESS_URL}",
    "WORDPRESS_USERNAME": "${WORDPRESS_USERNAME}",  
    "WORDPRESS_PASSWORD": "${WORDPRESS_PASSWORD}"
  }
}
```

### Claude Code Integration

`.claude/settings.local.json` references environment variables:

```json
{
  "permissions": {
    "allow": [
      "Bash(claude config set --global env.WORDPRESS_URL \"${WORDPRESS_URL}\")",
      "Bash(claude config set --global env.WORDPRESS_PASSWORD \"${WORDPRESS_PASSWORD}\")"
    ]
  }
}
```

### Deployment Integration

**Netlify Environment Variables**:
- Configure production secrets in Netlify dashboard
- Use different variable names for staging vs. production
- Enable automatic deployment on environment variable changes

**Local Development**:
- Never commit `.env` files to version control
- Use `.env.example` as template for new developers
- Document setup process in team onboarding

## Compliance and Auditing

### Audit Trail Requirements

**Change Tracking**:
- All credential rotations logged with timestamp and user
- Environment variable changes tracked in deployment logs
- Access attempts recorded in MCP server logs

**Compliance Checks**:
- Monthly credential inventory and validation
- Quarterly security policy review and updates
- Annual penetration testing of authentication mechanisms

### Documentation Updates

This document must be updated when:
- New environment variables are added
- Credential rotation procedures change
- Security policies are modified
- Incident response procedures are updated

---

**Document Owner**: DevOps/Security Team  
**Implementation Date**: 2025-01-30  
**Last Updated**: 2025-01-30  
**Next Review**: 2025-04-30  

**Related Documents**:
- `security/consolidated-headers.md` - Security header management
- `security/mcp-permissions.json` - Permission definitions
- `PRPs/permissions-audit-cleanup.md` - Original implementation PRP
- `.env.example` - Environment variable template