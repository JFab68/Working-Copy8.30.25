# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Praxis Initiative** website - a static HTML site for a criminal justice reform organization in Arizona. The site combines traditional static HTML pages with modern JavaScript components and is optimized for performance and accessibility.

### Architecture

- **Static HTML Foundation**: Main pages are numbered HTML files (e.g., `1 Homepage.html`, `2 Issues.html`) for clear organization
- **Component-Based JavaScript**: Core functionality in `js/core.js` with ComponentLoader class for navigation and mobile menu handling
- **CSS Architecture**: Split between critical inline CSS and optimized stylesheets, with both source and minified versions in `css/` and `dist/css/`
- **Performance-Optimized**: Uses resource hints, optimized fonts, and lazy loading with integrity checking for external resources

### Development Commands

```bash
# Start local development server
npm run serve

# Run visual audit (takes screenshots across all pages/devices)
npm run test:visual

# Release versioning
npm run release
```

### Key File Structure

- **HTML Pages**: Numbered sequence files (`1 Homepage.html` through `9 Donate.html`) plus program sub-pages (`4A-4E`)
- **JavaScript**: 
  - `js/core.js` - Main ComponentLoader class and navigation logic
  - `components.js` - Minimal component file
- **CSS**: Dual structure with source files in `css/` and optimized versions in `dist/css/`
- **Assets**: All media files organized in `10 Assets/` directory
- **Configuration**: 
  - `netlify.toml` - Deployment config with clean URL redirects and security headers
  - `manifest.json` - PWA configuration

### Visual Audit System

The project includes a comprehensive visual testing system in `scripts/visual-audit.js`:
- Tests all pages across desktop/tablet/mobile viewports
- Generates screenshots using Playwright
- Requires local server to be running (`npm run serve`)
- Results saved to `visual-audit-results/` directory

### Deployment

- **Platform**: Netlify with clean URL rewrites (e.g., `/about` → `/3 About.html`)
- **Security**: Comprehensive security headers including CSP, XSS protection
- **Caching**: Optimized cache headers for static assets (CSS, JS, images)

## PRP Framework Integration

This project now includes the **PRP (Product Requirement Prompt) Framework** for AI-assisted development. The core concept: **"PRP = PRD + curated codebase intelligence + agent/runbook"** - designed to enable AI agents to ship production-ready code on the first pass.

## Core Architecture

### Command-Driven System

- **pre-configured Claude Code commands** in `.claude/commands/`
- Commands organized by function:
  - `PRPs/` - PRP creation and execution workflows
  - `development/` - Core development utilities (prime-core, onboarding, debug)
  - `code-quality/` - Review and refactoring commands
  - `rapid-development/experimental/` - Parallel PRP creation and hackathon tools
  - `git-operations/` - Conflict resolution and smart git operations

### Template-Based Methodology

- **PRP Templates** in `PRPs/templates/` follow structured format with validation loops
- **Context-Rich Approach**: Every PRP must include comprehensive documentation, examples, and gotchas
- **Validation-First Design**: Each PRP contains executable validation gates (syntax, tests, integration)

### AI Documentation Curation

- `PRPs/ai_docs/` contains curated Claude Code documentation for context injection
- `claude_md_files/` provides framework-specific CLAUDE.md examples

## Development Commands

### PRP Execution

```bash
# Interactive mode (recommended for development)
uv run PRPs/scripts/prp_runner.py --prp [prp-name] --interactive

# Headless mode (for CI/CD)
uv run PRPs/scripts/prp_runner.py --prp [prp-name] --output-format json

# Streaming JSON (for real-time monitoring)
uv run PRPs/scripts/prp_runner.py --prp [prp-name] --output-format stream-json
```

### Key Claude Commands

- `/prp-base-create` - Generate comprehensive PRPs with research
- `/prp-base-execute` - Execute PRPs against codebase
- `/prp-planning-create` - Create planning documents with diagrams
- `/prime-core` - Prime Claude with project context
- `/review-staged-unstaged` - Review git changes using PRP methodology

## Critical Success Patterns

### The PRP Methodology

1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance

### PRP Structure Requirements

- **Goal**: Specific end state and desires
- **Why**: Business value and user impact
- **What**: User-visible behavior and technical requirements
- **All Needed Context**: Documentation URLs, code examples, gotchas, patterns
- **Implementation Blueprint**: Pseudocode with critical details and task lists
- **Validation Loop**: Executable commands for syntax, tests, integration

### Validation Gates (Must be Executable)

```bash
# Level 1: Syntax & Style
ruff check --fix && mypy .

# Level 2: Unit Tests
uv run pytest tests/ -v

# Level 3: Integration
uv run uvicorn main:app --reload
curl -X POST http://localhost:8000/endpoint -H "Content-Type: application/json" -d '{...}'

# Level 4: Deployment
# mcp servers, or other creative ways to self validate
```

## Anti-Patterns to Avoid

- L Don't create minimal context prompts - context is everything - the PRP must be comprehensive and self-contained, reference relevant documentation and examples.
- L Don't skip validation steps - they're critical for one-pass success - The better The AI is at running the validation loop, the more likely it is to succeed.
- L Don't ignore the structured PRP format - it's battle-tested
- L Don't create new patterns when existing templates work
- L Don't hardcode values that should be config
- L Don't catch all exceptions - be specific

## Working with This Framework

### When Creating new PRPs

1. **Context Process**: New PRPs must consist of context sections, Context is King!
2.

### When Executing PRPs

1. **Load PRP**: Read and understand all context and requirements
2. **ULTRATHINK**: Create comprehensive plan, break down into todos, use subagents, batch tool etc check prps/ai_docs/
3. **Execute**: Implement following the blueprint
4. **Validate**: Run each validation command, fix failures
5. **Complete**: Ensure all checklist items done

### Command Usage

- Read the .claude/commands directory
- Access via `/` prefix in Claude Code
- Commands are self-documenting with argument placeholders
- Use parallel creation commands for rapid development
- Leverage existing review and refactoring commands

## Project Structure Understanding

```
PRPs-agentic-eng/
.claude/
  commands/           # 28+ Claude Code commands
  settings.local.json # Tool permissions
PRPs/
  templates/          # PRP templates with validation
  scripts/           # PRP runner and utilities
  ai_docs/           # Curated Claude Code documentation
   *.md               # Active and example PRPs
 claude_md_files/        # Framework-specific CLAUDE.md examples
 pyproject.toml         # Python package configuration
```

Remember: This framework is about **one-pass implementation success through comprehensive context and validation**. Every PRP should contain the exact context for an AI agent to successfully implement working code in a single pass.

# Project-Specific Instructions

Project root: ./

