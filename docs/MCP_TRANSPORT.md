# MCP Transport Types Guide

## Overview

Mini Claude Code supports three MCP transport types, allowing you to choose the appropriate transport protocol for different use cases.

## Transport Type Comparison

| Feature | stdio Transport | Streamable HTTP | SSE Transport (Deprecated) |
|---------|----------------|-----------------|---------------------------|
| **Protocol Version** | - | 2025-03-26 | 2024-11-05 |
| **Status** | Stable | Recommended | Deprecated |
| **Use Case** | Local services | Remote services | Legacy compatibility |
| **Connection** | Standard I/O | Streamable HTTP | HTTP+SSE |
| **Network** | Local process | Network required | Network required |
| **Security** | Process isolation | HTTPS support | HTTPS required |
| **Performance** | High (local) | Depends on network | Depends on network |
| **Session Management** | None | Supported | Supported |
| **Examples** | npx, python scripts | Cloud API services | Legacy servers |

## stdio Transport (Recommended for Local Services)

### Use Cases

- Locally installed MCP servers
- Node.js, Python and other local processes
- File system, local database and other local resource access
- Development and testing environments

### Configuration Examples

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"],
      "env": {
        "DEBUG": "true"
      }
    },
    {
      "name": "local-python-server",
      "transport": "stdio",
      "command": "python",
      "args": ["-m", "my_mcp_server"],
      "env": {
        "PYTHONPATH": "/path/to/modules"
      }
    }
  ]
}
```

### Advantages

- ✅ Low latency, high performance
- ✅ Process isolation, more secure
- ✅ No network configuration needed
- ✅ Suitable for development and testing

### Considerations

- Requires local installation of server dependencies
- Each connection starts a new process
- Ensure `command` is available in PATH

## Streamable HTTP Transport (Recommended for Remote Services)

**Protocol Version: 2025-03-26 (New Standard)**

### Use Cases

- MCP services deployed in the cloud
- Cross-network service access
- Centrally managed enterprise services
- Multi-client shared services
- Applications requiring session management
- Scenarios requiring server push notifications

### Configuration Examples

```json
{
  "mcpServers": [
    {
      "name": "cloud-api",
      "transport": "streamable_http",
      "url": "https://api.example.com/mcp"
    },
    {
      "name": "internal-service",
      "transport": "streamable_http",
      "url": "http://localhost:3000/mcp"
    }
  ]
}
```

### Advantages

- ✅ Supports remote access
- ✅ No local dependency installation needed
- ✅ Supports load balancing and high availability
- ✅ Easy central management and updates
- ✅ Supports session management and recovery
- ✅ Supports server push notifications (SSE)
- ✅ Better error handling mechanisms
- ✅ Complies with latest MCP specification

### Considerations

- ⚠️ Network latency affects performance
- ⚠️ Requires stable network connection
- ⚠️ HTTPS recommended for production
- ⚠️ May require authentication (depending on server implementation)

### Technical Details

Streamable HTTP uses a single endpoint to handle multiple request types:
- **POST /mcp**: Client to server requests
- **GET /mcp**: Server to client notifications (SSE)
- **DELETE /mcp**: Session termination

## SSE Transport (Deprecated, backward compatibility only)

**Protocol Version: 2024-11-05 (Old Standard)**

⚠️ **Important**: SSE transport has been replaced by Streamable HTTP and is only recommended for connecting to legacy servers that don't support the new protocol.

### Use Cases

- Connecting to servers using legacy MCP protocol
- Backward compatibility requirements

### Configuration Examples

```json
{
  "mcpServers": [
    {
      "name": "legacy-server",
      "transport": "sse",
      "url": "https://legacy-api.example.com/sse"
    }
  ]
}
```

### Migration Recommendations

If you maintain MCP servers, it is recommended to:
1. Upgrade to Streamable HTTP transport
2. Support both transport types simultaneously for smooth transition
3. Mark SSE endpoints as deprecated in documentation

## Mixed Usage Example

You can configure multiple transport types simultaneously:

```json
{
  "mcpServers": [
    {
      "name": "local-filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    },
    {
      "name": "cloud-search",
      "transport": "streamable_http",
      "url": "https://search-api.example.com/mcp"
    },
    {
      "name": "local-database",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/mydb"
      }
    },
    {
      "name": "remote-ai-service",
      "transport": "streamable_http",
      "url": "https://ai-tools.example.com/mcp"
    },
    {
      "name": "legacy-service",
      "transport": "sse",
      "url": "https://old-server.example.com/sse",
      "comment": "Legacy server, pending migration"
    }
  ]
}
```

## Troubleshooting

### stdio Transport Issues

**Problem: Server fails to start**
```
❌ Failed to connect to MCP server "xxx": command not found
```

**Solution:**
- Check if `command` is in PATH
- Try using full path: `"/usr/local/bin/npx"`
- Ensure necessary dependencies are installed

**Problem: Permission error**
```
❌ EACCES: permission denied
```

**Solution:**
- Check file/directory permissions
- Ensure command has execute permissions
- Use `chmod +x` to add execute permissions

### SSE Transport Issues

**Problem: Connection timeout**
```
❌ Failed to connect to MCP server "xxx": timeout
```

**Solution:**
- Check network connection
- Verify URL is correct
- Confirm server is running
- Check firewall settings

**Problem: SSL certificate error**
```
❌ SSL certificate problem
```

**Solution:**
- Use valid HTTPS certificate
- Can use HTTP in development (not recommended for production)

## Performance Optimization Recommendations

### stdio Transport Optimization

1. **Connection Reuse**: Initialize all connections once at application startup
2. **Reasonable Environment Variable Configuration**: Only pass necessary environment variables
3. **Resource Limits**: Pay attention to process count and memory usage

### SSE Transport Optimization

1. **Use CDN**: If service supports it, use CDN for acceleration
2. **Choose Nearby Nodes**: Select geographically closer servers
3. **Implement Retry Mechanism**: Handle temporary network failures
4. **Caching Strategy**: Use caching reasonably to reduce requests

## Security Best Practices

### stdio Transport Security

- ✅ Limit command execution permissions
- ✅ Avoid running commands from untrusted sources
- ✅ Use environment variables to manage sensitive configurations
- ✅ Regularly update dependency packages

### SSE Transport Security

- ✅ Must use HTTPS in production
- ✅ Implement appropriate authentication
- ✅ Use environment variables to store API keys
- ✅ Regularly rotate keys and tokens
- ✅ Implement rate limiting
- ✅ Log and monitor access records

## Reference Resources

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Server Implementation Examples](https://github.com/modelcontextprotocol/servers)

