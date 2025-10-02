import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { MCPServerConfig } from '../config/mcp-config';
import { logErrorDebug } from '../utils/logger';

// Ensure Node.js types are available
declare const console: Console;
declare const process: NodeJS.Process;

export interface MCPTool {
    name: string;
    description?: string;
    inputSchema: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
    };
}

export interface MCPClientConnection {
    client: Client;
    transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport;
    serverName: string;
    tools: MCPTool[];
}

/**
 * MCP Client Manager
 * Manages connections to multiple MCP servers
 */
export class MCPClientManager {
    private connections: Map<string, MCPClientConnection> = new Map();
    private isInitialized: boolean = false;

    /**
     * Initialize all configured MCP server connections
     */
    async initialize(serverConfigs: MCPServerConfig[]): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        console.log(`\n🔌 Connecting to ${serverConfigs.length} MCP server(s)...\n`);

        for (const config of serverConfigs) {
            try {
                await this.connectToServer(config);
            } catch (error: any) {
                console.error(`❌ Failed to connect to MCP server "${config.name}":`, error.message);
                logErrorDebug(`Failed to connect to MCP server: ${config.name}`, error);
            }
        }

        this.isInitialized = true;
        
        if (this.connections.size > 0) {
            console.log(`✅ Successfully connected to ${this.connections.size} MCP server(s)\n`);
        } else {
            console.log(`ℹ️  No MCP servers connected\n`);
        }
    }

    /**
     * Connect to a single MCP server
     */
    private async connectToServer(config: MCPServerConfig): Promise<void> {
        console.log(`  → Connecting: ${config.name}...`);

        // Select transport type based on configuration, defaults to stdio
        const transportType = config.transport || 'stdio';
        let transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport;

        if (transportType === 'streamable_http') {
            // Streamable HTTP transport (new standard, protocol version 2025-03-26)
            if (!config.url) {
                throw new Error(`MCP server "${config.name}" is configured with streamable_http transport but no URL provided`);
            }
            console.log(`    Using Streamable HTTP transport: ${config.url}`);
            transport = new StreamableHTTPClientTransport(new URL(config.url));
        } else if (transportType === 'sse') {
            // SSE transport (old standard, protocol version 2024-11-05, deprecated)
            if (!config.url) {
                throw new Error(`MCP server "${config.name}" is configured with SSE transport but no URL provided`);
            }
            console.log(`    Using SSE transport (deprecated): ${config.url}`);
            transport = new SSEClientTransport(new URL(config.url));
        } else {
            // stdio transport
            if (!config.command) {
                throw new Error(`MCP server "${config.name}" is configured with stdio transport but no command provided`);
            }
            console.log(`    Using stdio transport: ${config.command}`);
            transport = new StdioClientTransport({
                command: config.command,
                args: config.args || [],
                env: {
                    ...(process.env as Record<string, string>),
                    ...(config.env || {}),
                } as Record<string, string>,
            });
        }

        const client = new Client({
            name: "mini-claude-code",
            version: "0.1.0",
        }, {
            capabilities: {
                tools: {},
            },
        });

        await client.connect(transport);

        // Get the list of tools provided by the server
        const toolsResult = await client.listTools();
        const tools = toolsResult.tools.map((tool: any) => ({
            name: `${config.name}__${tool.name}`,
            description: tool.description || '',
            inputSchema: tool.inputSchema || { type: 'object' },
        }));

        this.connections.set(config.name, {
            client,
            transport,
            serverName: config.name,
            tools,
        });

        console.log(`    ✓ ${config.name}: ${tools.length} tool(s) available`);
    }

    /**
     * Get all available MCP tools
     */
    getAllTools(): MCPTool[] {
        const allTools: MCPTool[] = [];
        
        for (const connection of this.connections.values()) {
            allTools.push(...connection.tools);
        }

        return allTools;
    }

    /**
     * Call an MCP tool
     */
    async callTool(toolName: string, args: any): Promise<any> {
        // Parse tool name (format: serverName__toolName)
        const [serverName, ...toolNameParts] = toolName.split('__');
        const actualToolName = toolNameParts.join('__');

        const connection = this.connections.get(serverName);
        if (!connection) {
            throw new Error(`MCP server "${serverName}" is not connected`);
        }

        try {
            const result = await connection.client.callTool({
                name: actualToolName,
                arguments: args,
            });

            // Process result
            if (Array.isArray(result.content)) {
                return result.content.map((item: any) => {
                    if (item.type === 'text') {
                        return item.text;
                    }
                    return JSON.stringify(item);
                }).join('\n');
            }

            return JSON.stringify(result.content);
        } catch (error: any) {
            throw new Error(`Failed to call MCP tool (${toolName}): ${error.message}`);
        }
    }

    /**
     * Close all connections
     */
    async closeAll(): Promise<void> {
        for (const connection of this.connections.values()) {
            try {
                await connection.client.close();
            } catch (error) {
                logErrorDebug(`Error closing connection to ${connection.serverName}`, error);
            }
        }
        this.connections.clear();
        this.isInitialized = false;
    }

    /**
     * Get the number of connected servers
     */
    getConnectionCount(): number {
        return this.connections.size;
    }

    /**
     * List all connected servers
     */
    getConnectedServers(): string[] {
        return Array.from(this.connections.keys());
    }
}

// Global MCP client manager instance
export const mcpClientManager = new MCPClientManager();

