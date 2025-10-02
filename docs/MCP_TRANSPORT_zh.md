# MCP 传输方式详解

## 概述

Mini Claude Code 支持三种 MCP 传输方式，可以根据不同的使用场景选择合适的传输协议。

## 传输方式对比

| 特性 | stdio 传输 | Streamable HTTP | SSE 传输（已弃用） |
|------|-----------|----------------|------------------|
| **协议版本** | - | 2025-03-26 | 2024-11-05 |
| **状态** | 稳定 | 推荐 | 已弃用 |
| **适用场景** | 本地服务 | 远程服务 | 兼容旧服务 |
| **连接方式** | 标准输入输出 | Streamable HTTP | HTTP+SSE |
| **网络要求** | 本地进程 | 需要网络连接 | 需要网络连接 |
| **安全性** | 进程隔离 | 支持 HTTPS | 需要 HTTPS |
| **性能** | 高（本地通信） | 取决于网络延迟 | 取决于网络延迟 |
| **会话管理** | 无 | 支持 | 支持 |
| **示例** | npx, python 脚本 | 云端 API 服务 | 旧版服务器 |

## stdio 传输（推荐用于本地服务）

### 使用场景

- 本地安装的 MCP 服务器
- Node.js、Python 等本地进程
- 文件系统、本地数据库等本地资源访问
- 开发和测试环境

### 配置示例

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

### 优点

- ✅ 低延迟，高性能
- ✅ 进程隔离，更安全
- ✅ 无需网络配置
- ✅ 适合开发测试

### 注意事项

- 需要在本地安装服务器依赖
- 每个连接会启动一个新进程
- 确保 `command` 在 PATH 中可用

## Streamable HTTP 传输（推荐用于远程服务）

**协议版本：2025-03-26（新标准）**

### 使用场景

- 云端部署的 MCP 服务
- 跨网络的服务访问
- 集中管理的企业服务
- 多客户端共享的服务
- 需要会话管理的应用
- 需要服务器推送通知的场景

### 配置示例

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

### 优点

- ✅ 支持远程访问
- ✅ 无需本地安装依赖
- ✅ 支持负载均衡和高可用
- ✅ 便于集中管理和更新
- ✅ 支持会话管理和恢复
- ✅ 支持服务器推送通知（SSE）
- ✅ 更好的错误处理机制
- ✅ 符合最新 MCP 规范

### 注意事项

- ⚠️ 网络延迟会影响性能
- ⚠️ 需要稳定的网络连接
- ⚠️ 生产环境建议使用 HTTPS
- ⚠️ 可能需要身份认证（取决于服务器实现）

### 技术细节

Streamable HTTP 使用单个端点处理多种请求：
- **POST /mcp**: 客户端到服务器的请求
- **GET /mcp**: 服务器到客户端的通知（SSE）
- **DELETE /mcp**: 会话终止

## SSE 传输（已弃用，仅用于向后兼容）

**协议版本：2024-11-05（旧标准）**

⚠️ **重要**：SSE 传输已被 Streamable HTTP 取代，仅建议用于连接不支持新协议的旧服务器。

### 使用场景

- 连接使用旧版 MCP 协议的服务器
- 向后兼容性要求

### 配置示例

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

### 迁移建议

如果你维护 MCP 服务器，建议：
1. 升级到 Streamable HTTP 传输
2. 同时支持两种传输方式以实现平滑过渡
3. 在文档中标注 SSE 端点已弃用

## 混合使用示例

你可以同时配置多种传输方式：

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
      "comment": "旧版服务器，待迁移"
    }
  ]
}
```

## 故障排查

### stdio 传输问题

**问题：服务器无法启动**
```
❌ 连接 MCP 服务器 "xxx" 失败: command not found
```

**解决方案：**
- 检查 `command` 是否在 PATH 中
- 尝试使用完整路径：`"/usr/local/bin/npx"`
- 确保已安装必要的依赖

**问题：权限错误**
```
❌ EACCES: permission denied
```

**解决方案：**
- 检查文件/目录权限
- 确保命令有执行权限
- 使用 `chmod +x` 添加执行权限

### SSE 传输问题

**问题：连接超时**
```
❌ 连接 MCP 服务器 "xxx" 失败: timeout
```

**解决方案：**
- 检查网络连接
- 验证 URL 是否正确
- 确认服务器是否正在运行
- 检查防火墙设置

**问题：SSL 证书错误**
```
❌ SSL certificate problem
```

**解决方案：**
- 使用有效的 HTTPS 证书
- 开发环境可以使用 HTTP（不推荐生产使用）

## 性能优化建议

### stdio 传输优化

1. **复用连接**：应用启动时一次性初始化所有连接
2. **合理配置环境变量**：只传递必要的环境变量
3. **资源限制**：注意进程数量和内存使用

### SSE 传输优化

1. **使用 CDN**：如果服务支持，使用 CDN 加速
2. **选择近距离节点**：选择地理位置较近的服务器
3. **实现重试机制**：处理临时网络故障
4. **缓存策略**：合理使用缓存减少请求

## 安全最佳实践

### stdio 传输安全

- ✅ 限制命令执行权限
- ✅ 避免从不可信源运行命令
- ✅ 使用环境变量管理敏感配置
- ✅ 定期更新依赖包

### SSE 传输安全

- ✅ 生产环境必须使用 HTTPS
- ✅ 实现适当的身份认证
- ✅ 使用环境变量存储 API 密钥
- ✅ 定期轮换密钥和令牌
- ✅ 实现速率限制
- ✅ 记录和监控访问日志

## 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [服务器实现示例](https://github.com/modelcontextprotocol/servers)

