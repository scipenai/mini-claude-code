# MCP (Model Context Protocol) Integration Guide

## Overview

Mini Claude Code now supports MCP (Model Context Protocol), allowing you to extend the AI assistant's capabilities through MCP servers.

## What is MCP?

MCP (Model Context Protocol) is an open protocol that enables AI applications to securely interact with external tools and data sources. With MCP, you can:

- Connect to various data sources (filesystem, databases, APIs, etc.)
- Use third-party tools and services
- Extend the AI assistant's capabilities without modifying core code

## Quick Start

### 1. Install Dependencies

Make sure project dependencies are installed:

```bash
npm install
```

### 2. Create MCP Configuration File

Create a `.mcp.json` file in the project root directory:

```bash
cp .mcp.example.json .mcp.json
```

### 3. Configure MCP Servers

Edit the `.mcp.json` file to configure the MCP servers you want to use:

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
    }
  ]
}
```

### 4. Run the Application

```bash
npm run dev
```

The application will automatically connect to the configured MCP servers when it starts.

## Configuration Guide

### Transport Types

Mini Claude Code supports three MCP transport types:

#### 1. stdio Transport (Local Process)

Communicates with local MCP server processes via standard input/output, suitable for:
- Locally installed MCP servers
- Node.js, Python and other local processes
- Servers that need to access local resources

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  ]
}
```

#### 2. Streamable HTTP Transport (Recommended for Remote Servers)

**Protocol Version: 2025-03-26 (New Standard)**

Communicates with remote MCP servers via Streamable HTTP, the latest HTTP transport standard, suitable for:
- MCP services deployed in the cloud
- Remote HTTP API services
- Servers that need cross-network access
- Session management and notification support

```json
{
  "mcpServers": [
    {
      "name": "remote-service",
      "transport": "streamable_http",
      "url": "https://your-mcp-server.example.com/mcp"
    }
  ]
}
```

#### 3. SSE Transport (Deprecated, backward compatibility only)

**Protocol Version: 2024-11-05 (Old Standard)**

⚠️ **Note**: This transport type is deprecated, it is recommended to use `streamable_http` instead.

```json
{
  "mcpServers": [
    {
      "name": "legacy-service",
      "transport": "sse",
      "url": "https://legacy-server.example.com/sse"
    }
  ]
}
```

### Configuration Fields

#### Common Fields
- `name`: Unique identifier for the server (required)
- `transport`: Transport type (optional, defaults to `"stdio"`)
  - `"stdio"`: Local process communication
  - `"streamable_http"`: Streamable HTTP transport (recommended for remote services)
  - `"sse"`: SSE transport (deprecated)

#### stdio Transport Fields
- `command`: Command to start the server, such as `npx`, `node`, `python`, etc. (required for stdio)
- `args`: Command arguments array (optional)
- `env`: Environment variables object (optional)

#### HTTP Transport Fields (streamable_http and sse)
- `url`: HTTP/HTTPS URL of the MCP server (required)

> 💡 **Tip**: For detailed transport type descriptions, use cases, and best practices, see [MCP Transport Guide](MCP_TRANSPORT.md)

## Available MCP Servers

### Official MCP Servers

1. **Filesystem Server** (`@modelcontextprotocol/server-filesystem`)
   - Provides file and directory operations
   - Requires specifying allowed directory paths

2. **GitHub Server** (`@modelcontextprotocol/server-github`)
   - Provides GitHub API access
   - Requires GitHub Personal Access Token

3. **PostgreSQL Server** (`@modelcontextprotocol/server-postgres`)
   - Provides database query functionality
   - Requires database connection configuration

4. **Google Drive Server** (`@modelcontextprotocol/server-gdrive`)
   - Provides Google Drive file operations
   - Requires OAuth authentication

5. **Slack Server** (`@modelcontextprotocol/server-slack`)
   - Provides Slack message sending and channel management
   - Requires Slack API token

More official servers can be found at: https://github.com/modelcontextprotocol/servers

### Community Servers

Many community-developed MCP servers are also available, covering various use cases:
- Database access (MySQL, MongoDB, etc.)
- API integrations
- Development tools
- Cloud services

## Configuration Examples

### Example 1: Filesystem Server

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/user/projects"
      ]
    }
  ]
}
```

### Example 2: GitHub Server

```json
{
  "mcpServers": [
    {
      "name": "github",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-personal-access-token"
      }
    }
  ]
}
```

### Example 3: Multiple Servers

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    },
    {
      "name": "github",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    },
    {
      "name": "remote-api",
      "transport": "streamable_http",
      "url": "https://api.example.com/mcp"
    }
  ]
}
```

## How It Works

### Initialization Process

1. Application reads the `.mcp.json` configuration file at startup
2. Creates connections to each configured MCP server
3. Retrieves the list of tools provided by each server
4. Registers all MCP tools in the assistant's tool list

### Tool Naming Convention

MCP tool names follow this format: `serverName__toolName`

For example:
- `filesystem__read_file` - Read file tool from filesystem server
- `github__create_issue` - Create issue tool from GitHub server

### Tool Invocation Process

1. User sends a request to the assistant
2. Assistant decides which tool to use
3. If it's an MCP tool, the request is dispatched to the corresponding MCP server
4. Server executes the tool and returns results
5. Assistant processes the results and responds to the user

## Troubleshooting

### Connection Failures

If MCP server connection fails, check:

1. Is the command path correct?
2. Are all dependencies installed?
3. Are required environment variables set?
4. Check console error messages for details

### Tool Not Available

If MCP tools are not showing up:

1. Confirm MCP server started successfully
2. Check server logs for errors
3. Verify configuration file format is correct
4. Restart the application

### Permission Issues

If encountering permission errors:

1. Check if specified directory paths exist
2. Verify current user has necessary permissions
3. For stdio transport, ensure commands are executable

## Security Considerations

### Access Control

- Only configure trusted MCP servers
- Limit filesystem server access to necessary directories
- Use environment variables to store sensitive information (API keys, tokens, etc.)
- Regularly review and update server configurations

### Best Practices

1. **Principle of Least Privilege**: Grant only necessary permissions to each server
2. **Environment Variable Security**: Don't hardcode sensitive information in configuration files
3. **Regular Updates**: Keep MCP servers and SDKs up to date
4. **Logging and Monitoring**: Record MCP server connection and usage for auditing

## Extending Functionality

### Creating Custom MCP Servers

You can create your own MCP servers to integrate with specific tools or services:

#### Basic Steps

1. Use the MCP SDK to create a server
2. Define tools and resources
3. Implement tool handling logic
4. Configure your server in `.mcp.json`

### Reference Resources

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Server Examples](https://github.com/modelcontextprotocol/servers)

## FAQ

### Q: How do I know which MCP servers are available?

A: You can find official and community-developed servers in the [MCP Server Repository](https://github.com/modelcontextprotocol/servers).

### Q: Can I use multiple MCP servers simultaneously?

A: Yes, you can configure multiple servers in the `.mcp.json` file, the application will connect to all of them at startup.

### Q: How do I update MCP server configurations?

A: Edit the `.mcp.json` file and restart the application for changes to take effect.

### Q: Can MCP servers access my file system?

A: Only if you explicitly configure the filesystem server and specify allowed directories. All file operations are restricted to the configured directories.

### Q: What should I do if an MCP server is slow?

A: 
- Check network connection (for remote servers)
- Verify if server resources are sufficient
- Consider using local servers instead of remote ones
- Check if there are performance optimization options available

## Next Steps

- Learn more in the [MCP Transport Guide](MCP_TRANSPORT.md)
- View the [Quick Start Guide](MCP_QUICK_START.md)
- Explore the [MCP Server Repository](https://github.com/modelcontextprotocol/servers)

## Support

If you encounter issues or have questions:

1. Check this document and related guides
2. Review console error messages
3. Visit the [MCP Official Documentation](https://modelcontextprotocol.io/)
4. Submit an issue in the project repository

