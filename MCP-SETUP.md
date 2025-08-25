# MCP.js Relay Setup - Praxis Initiative

This directory contains a complete Model Context Protocol (MCP) browser relay setup for the Praxis Initiative website.

## What is MCP?

Model Context Protocol (MCP) allows AI assistants like Claude to interact with external systems and services through standardized tools and resources.

## Files

- **mcp-relay.html** - Web interface for MCP relay management
- **start-mcp-relay.js** - Node.js server that provides WebSocket transport
- **.mcp.json** - MCP server configuration
- **MCP-SETUP.md** - This setup guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the MCP Relay Server**
   ```bash
   npm run mcp-relay
   ```
   
   Or directly:
   ```bash
   node start-mcp-relay.js
   ```

3. **Open the Web Interface**
   - Navigate to: http://localhost:3000
   - Click "Initialize MCP Relay"
   - Click "Connect to Servers"

## Configuration

The MCP servers are configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "automattic-wordpress": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@automattic/mcp-wordpress-remote"],
      "env": {
        "WORDPRESS_URL": "https://praxisinitiative.org",
        "WORDPRESS_USERNAME": "Coder",
        "WORDPRESS_PASSWORD": "5mu7 wpMy 7Q8h W99G yPzR KYMj"
      }
    },
    "elementor-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "elementor-mcp"],
      "env": {
        "WP_URL": "https://praxisinitiative.org",
        "WP_APP_USER": "Coder",
        "WP_APP_PASSWORD": "5mu7 wpMy 7Q8h W99G yPzR KYMj"
      }
    }
  }
}
```

## Available MCP Servers

### 1. Automattic WordPress Server  
- **Purpose**: Official WordPress MCP server by Automattic
- **Tools**: Create posts, update pages, upload media, manage users
- **Resources**: Posts, pages, media library, comments, users
- **Setup**: Configure WordPress credentials in `.mcp.json`
- **Package**: @automattic/mcp-wordpress-remote (v0.2.10)

### 2. Elementor MCP Server
- **Purpose**: Direct Elementor page builder integration  
- **Tools**: CRUD operations on Elementor elements (sections, columns, widgets)
- **Resources**: Elementor pages, layouts, widget configurations
- **Setup**: Configure WordPress credentials in `.mcp.json`
- **Package**: elementor-mcp (v1.0.1)
- **Special**: Only MCP server built specifically for Elementor

### 3. Browser Tools (Built-in)
- **Purpose**: Browser automation and debugging
- **Tools**: Screenshots, console logs, network monitoring
- **Resources**: Browser state, performance metrics

### 4. Filesystem (Built-in)  
- **Purpose**: File system operations
- **Tools**: Read/write files, directory operations
- **Resources**: Local files and directories

## Usage Examples

### WordPress Integration
```javascript
// List WordPress posts
const posts = await mcpClient.callTool('wordpress/list_posts', {
  status: 'publish',
  per_page: 10
});

// Create new post
const newPost = await mcpClient.callTool('wordpress/create_post', {
  title: 'Criminal Justice Reform Update',
  content: 'Latest developments in prison oversight...',
  status: 'draft'
});
```

### Elementor Integration
```javascript
// Get Elementor page data
const pageData = await mcpClient.callTool('get_elementor_page', {
  page_id: 123
});

// Create new Elementor section
const newSection = await mcpClient.callTool('create_elementor_section', {
  page_id: 123,
  section_data: {
    layout: 'full_width',
    content_width: 'boxed'
  }
});

// Update Elementor widget
const widget = await mcpClient.callTool('update_elementor_widget', {
  widget_id: 'abc123',
  widget_type: 'text-editor',
  settings: {
    editor: 'Updated content for Praxis Initiative...'
  }
});
```

### Browser Automation
```javascript
// Take screenshot for audit
const screenshot = await mcpClient.callTool('take_screenshot', {
  selector: '.homepage-hero',
  name: 'homepage-hero-audit'
});

// Check console errors
const errors = await mcpClient.callTool('get_console_errors');
```

## Security Notes

- WordPress credentials are stored in environment variables
- MCP relay runs on localhost only by default
- All connections use secure WebSocket protocols
- Sensitive operations require authentication

## Troubleshooting

### Connection Issues
- Ensure port 3000 is available
- Check firewall settings for localhost access
- Verify Node.js and npm are installed

### WordPress Connection
- Update WordPress credentials in `.mcp.json`
- Generate application password in WordPress admin
- Test connectivity with WordPress site

### Browser Transport
- Modern browser required (Chrome, Firefox, Safari, Edge)
- WebSocket support must be enabled
- Check browser console for errors

## Development

To extend the MCP relay:

1. Add new server configurations to `.mcp.json`
2. Update `start-mcp-relay.js` to handle new message types
3. Modify `mcp-relay.html` UI for additional features

## Support

For issues with MCP setup:
- Check the console logs in browser and terminal
- Verify all dependencies are installed
- Ensure WordPress credentials are correct

---

**Praxis Initiative** - Criminal Justice Reform & Prison Oversight  
Website: https://praxisinitiative.org