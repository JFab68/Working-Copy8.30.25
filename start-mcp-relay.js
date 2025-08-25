#!/usr/bin/env node

/**
 * MCP Relay Server Starter
 * Praxis Initiative - Model Context Protocol Browser Transport
 */

const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.MCP_RELAY_PORT || 3000;
const CONFIG_FILE = path.join(__dirname, '.mcp.json');

class MCPRelayServer {
    constructor() {
        this.servers = new Map();
        this.config = {};
        this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
                this.config = JSON.parse(configData);
                console.log('📋 Loaded MCP configuration from .mcp.json');
            } else {
                console.log('⚠️ No .mcp.json config file found');
            }
        } catch (error) {
            console.error('❌ Error loading MCP config:', error.message);
        }
    }

    startServer() {
        // Create HTTP server for serving the relay interface
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                // Serve the MCP relay HTML interface
                const htmlPath = path.join(__dirname, 'mcp-relay.html');
                if (fs.existsSync(htmlPath)) {
                    const html = fs.readFileSync(htmlPath, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(html);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('MCP Relay interface not found');
                }
            } else if (req.url === '/health') {
                // Health check endpoint
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    servers: this.servers.size,
                    timestamp: new Date().toISOString()
                }));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });

        // Create WebSocket server for MCP communication
        const wss = new WebSocket.Server({ 
            server,
            path: '/mcp-relay'
        });

        wss.on('connection', (ws) => {
            console.log('🔗 New WebSocket connection established');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log('📨 Received MCP message:', message.method || 'response');
                    
                    // Handle MCP protocol messages
                    const response = await this.handleMCPMessage(message);
                    if (response) {
                        ws.send(JSON.stringify(response));
                    }
                } catch (error) {
                    console.error('❌ Error handling message:', error.message);
                    ws.send(JSON.stringify({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal error',
                            data: error.message
                        },
                        id: null
                    }));
                }
            });

            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
            });

            // Send welcome message
            ws.send(JSON.stringify({
                jsonrpc: '2.0',
                method: 'notifications/initialized',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {},
                        resources: {},
                        prompts: {}
                    },
                    serverInfo: {
                        name: 'praxis-mcp-relay',
                        version: '1.0.0'
                    }
                }
            }));
        });

        server.listen(PORT, () => {
            console.log(`🚀 MCP Relay Server started on port ${PORT}`);
            console.log(`🌐 Interface: http://localhost:${PORT}`);
            console.log(`🔗 WebSocket: ws://localhost:${PORT}/mcp-relay`);
            console.log(`💚 Health check: http://localhost:${PORT}/health`);
            
            if (Object.keys(this.config.mcpServers || {}).length > 0) {
                console.log('📡 Available MCP servers:');
                for (const [name, config] of Object.entries(this.config.mcpServers || {})) {
                    const description = name === 'automattic-wordpress' ? 
                        '(Official Automattic WordPress MCP)' : '';
                    console.log(`  - ${name}: ${config.command} ${config.args?.join(' ') || ''} ${description}`);
                }
            }
        });
    }

    async handleMCPMessage(message) {
        switch (message.method) {
            case 'initialize':
                return {
                    jsonrpc: '2.0',
                    result: {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {},
                            resources: {},
                            prompts: {}
                        },
                        serverInfo: {
                            name: 'praxis-mcp-relay',
                            version: '1.0.0'
                        }
                    },
                    id: message.id
                };

            case 'ping':
                return {
                    jsonrpc: '2.0',
                    result: {
                        status: 'pong',
                        timestamp: new Date().toISOString()
                    },
                    id: message.id
                };

            case 'tools/list':
                return {
                    jsonrpc: '2.0',
                    result: {
                        tools: [
                            {
                                name: 'wordpress/list_posts',
                                description: 'List WordPress posts'
                            },
                            {
                                name: 'wordpress/create_post',
                                description: 'Create a new WordPress post'
                            }
                        ]
                    },
                    id: message.id
                };

            case 'resources/list':
                return {
                    jsonrpc: '2.0',
                    result: {
                        resources: [
                            {
                                uri: 'posts://wordpress',
                                name: 'WordPress Posts',
                                description: 'All WordPress posts'
                            },
                            {
                                uri: 'pages://wordpress',
                                name: 'WordPress Pages',
                                description: 'All WordPress pages'
                            }
                        ]
                    },
                    id: message.id
                };

            default:
                console.log(`🤔 Unhandled MCP method: ${message.method}`);
                return null;
        }
    }
}

// Start the server
if (require.main === module) {
    console.log('🎯 Starting Praxis Initiative MCP Relay Server...');
    console.log('📍 Project: Criminal Justice Reform & Prison Oversight');
    console.log('🔗 Website: https://praxisinitiative.org\n');
    
    const relay = new MCPRelayServer();
    relay.startServer();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down MCP Relay Server...');
        process.exit(0);
    });
}

module.exports = MCPRelayServer;