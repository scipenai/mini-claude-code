/**
 * MCP Server Configuration
 * 
 * Configuration for connecting to MCP servers
 * Supports three transport types: stdio (local process), streamable_http (new standard), sse (deprecated)
 */

import { WORKDIR } from './environment';

export type MCPTransportType = 'stdio' | 'streamable_http' | 'sse';

export interface MCPServerConfig {
    name: string;
    transport?: MCPTransportType; // Transport type, defaults to 'stdio'
    
    // stdio transport configuration
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    
    // HTTP transport configuration (streamable_http and sse)
    url?: string;
}

/**
 * Default MCP server configuration
 * Users can create .mcp.json in the project root directory to customize configuration
 */
export const defaultMCPServers: MCPServerConfig[] = [
    // Example: Filesystem server
    // {
    //     name: "filesystem",
    //     command: "npx",
    //     args: ["-y", "@modelcontextprotocol/server-filesystem", WORKDIR],
    // },
    
    // Example: GitHub server
    // {
    //     name: "github",
    //     command: "npx",
    //     args: ["-y", "@modelcontextprotocol/server-github"],
    //     env: {
    //         GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
    //     }
    // }
];

/**
 * Load MCP server configuration from config file
 */
export async function loadMCPConfig(): Promise<MCPServerConfig[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const configPath = path.join(WORKDIR, '.mcp.json');
    
    try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content);
        return config.mcpServers || defaultMCPServers;
    } catch (error) {
        // If config file doesn't exist, use default configuration
        return defaultMCPServers;
    }
}


