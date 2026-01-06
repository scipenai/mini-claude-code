import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import { clampText } from '../utils/text-helpers';
import { WORKDIR } from '../config/environment';
import type { BashToolInput } from '../types';

/**
 * Dangerous command patterns for Unix-like systems
 * Uses regex for more accurate detection and to prevent bypasses
 */
const UNIX_DANGEROUS_PATTERNS: (RegExp | string)[] = [
    // File system destruction
    /rm\s+(-[rf]+\s*)+\/+(\s|$)/i,           // rm -rf /, rm -r /, rm -f /
    /rm\s+(-[rf]+\s*)+\/\*+/i,                // rm -rf /*, rm -r /*
    /rm\s+(-[rf]+\s*)+~+/i,                   // rm -rf ~
    /rm\s+(-[rf]+\s*)+\$HOME/i,               // rm -rf $HOME
    
    // Privilege escalation
    /sudo\s+/i,                                // sudo (any command)
    /su\s+-/i,                                 // su - (switch user)
    
    // Disk operations
    /mkfs/i,                                   // mkfs (format filesystem)
    /dd\s+if=/i,                               // dd if= (disk operations)
    />\s*\/dev\/sd[a-z]/i,                    // Write directly to disk
    />\s*\/dev\/nvme/i,                       // Write to NVMe
    
    // System control
    /shutdown/i,                               // shutdown
    /reboot/i,                                 // reboot
    /poweroff/i,                               // poweroff
    /halt/i,                                   // halt
    /init\s+0/i,                               // init 0
    /init\s+6/i,                               // init 6
    /systemctl\s+(poweroff|reboot|halt)/i,     // systemctl power commands
    
    // Kernel operations
    /modprobe/i,                               // modprobe (load kernel modules)
    /insmod/i,                                 // insmod (insert kernel module)
    /rmmod/i,                                  // rmmod (remove kernel module)
    
    // Package management (potentially dangerous)
    /apt\s+(-[a-z]+\s+)?remove\s+--purge/i,   // apt remove --purge (may break system)
    /yum\s+remove/i,                           // yum remove
    /dnf\s+remove/i,                           // dnf remove
    
    // Network dangerous operations
    /iptables\s+-F/i,                          // iptables flush
    /ip\s+link\s+delete/i,                     // delete network interface
    
    // Fork bombs and resource exhaustion
    /:\(\)\{.*;\}.*;/,                         // fork bomb pattern :(){:|:&};:
    /while\s+true.*do/i,                       // infinite loops
    
    // Remote code execution patterns
    /curl.*\|.*bash/i,                         // curl | bash
    /curl.*\|.*sh/i,                           // curl | sh
    /wget.*\|.*bash/i,                         // wget | bash
    /wget.*\|.*sh/i,                           // wget | sh
    /eval\s*\$\(/i,                            // eval $( command substitution
    
    // Dangerous redirection
    />\s*\/etc\/passwd/i,                      // Overwrite password file
    />\s*\/etc\/shadow/i,                      // Overwrite shadow file
    />\s*\/etc\/sudoers/i,                     // Overwrite sudoers
    />\s*\/boot/i,                             // Write to boot
    
    // Process manipulation
    /kill\s+-9\s+1/i,                          // kill init process
    /killall\s+-9/i,                           // kill all processes
    
    // Dangerous chmod operations
    /chmod\s+777\s+\//i,                       // chmod 777 on root
    /chmod\s+-R\s+777/i,                       // recursive 777
];

/**
 * Dangerous command patterns for Windows
 */
const WIN32_DANGEROUS_PATTERNS: (RegExp | string)[] = [
    // File system operations
    /format\s+[a-z]:/i,                        // format drive
    /del\s+\/[sS]/i,                           // del /s (recursive delete)
    /rmdir\s+\/[sS]/i,                         // rmdir /s
    /rd\s+\/[sS]/i,                            // rd /s
    /remove-item\s+.*-recurse/i,               // PowerShell recursive delete
    /rm\s+.*-recurse/i,                        // PowerShell rm alias
    
    // System operations
    /shutdown/i,                               // shutdown
    /restart-computer/i,                       // PowerShell restart
    /stop-computer/i,                          // PowerShell stop
    
    // Disk operations
    /diskpart/i,                               // diskpart
    /format-volume/i,                          // PowerShell format
    
    // Registry operations
    /reg\s+delete/i,                           // reg delete
    /remove-item.*HKLM/i,                      // Delete registry keys
    /remove-item.*HKCU/i,
    
    // Dangerous PowerShell
    /invoke-expression.*\(/i,                  // IEX (Invoke-Expression)
    /iex\s+/i,                                 // IEX alias
    
    // Process operations
    /stop-process.*-force.*-name\s+explorer/i, // Kill explorer
    /taskkill\s+\/f.*explorer/i,               // Force kill explorer
];

/**
 * Safe commands whitelist (for common operations)
 * These bypass the dangerous command check
 */
const SAFE_COMMAND_PREFIXES: string[] = [
    'ls', 'dir', 'pwd', 'cd', 'cat', 'echo', 'grep',
    'find', 'which', 'whereis', 'type', 'file',
    'head', 'tail', 'less', 'more', 'wc',
    'git', 'npm', 'node', 'python', 'pip',
    'yarn', 'pnpm', 'cargo', 'rustc',
    'tsc', 'tsx', 'ts-node',
    'make', 'cmake', 'gcc', 'g++', 'clang',
    'docker ps', 'docker images', 'docker logs',
    'kubectl get', 'kubectl describe',
];

/**
 * Normalize command string for detection
 * - Remove extra whitespace
 * - Handle common obfuscation attempts
 */
function normalizeCommand(cmd: string): string {
    return cmd
        .toLowerCase()
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .replace(/\\\s/g, '')            // Remove escaped spaces
        .replace(/['"]/g, '')            // Remove quotes
        .trim();
}

/**
 * Check if command matches safe patterns
 */
function isSafeCommand(cmd: string): boolean {
    const normalized = normalizeCommand(cmd);
    return SAFE_COMMAND_PREFIXES.some(prefix => 
        normalized.startsWith(prefix.toLowerCase())
    );
}

/**
 * Check if command is dangerous
 * Returns true if command matches any dangerous pattern
 */
function isDangerousCommand(cmd: string): boolean {
    // First check if it's a known safe command
    if (isSafeCommand(cmd)) {
        return false;
    }
    
    const normalized = normalizeCommand(cmd);
    const patterns = process.platform === 'win32' 
        ? WIN32_DANGEROUS_PATTERNS 
        : UNIX_DANGEROUS_PATTERNS;
    
    for (const pattern of patterns) {
        if (pattern instanceof RegExp) {
            if (pattern.test(normalized)) {
                return true;
            }
        } else {
            if (normalized.includes(pattern.toLowerCase())) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Get detailed error message for blocked command
 */
function getDangerousCommandError(cmd: string): string {
    const normalized = normalizeCommand(cmd);
    
    // Try to identify what made it dangerous
    if (/rm.*-[rf].*\//.test(normalized)) {
        return 'Blocked: Recursive deletion of root or system directories is not allowed';
    }
    if (/sudo/.test(normalized)) {
        return 'Blocked: Commands requiring elevated privileges (sudo) are not allowed';
    }
    if (/shutdown|reboot|poweroff/.test(normalized)) {
        return 'Blocked: System power commands are not allowed';
    }
    if (/\|.*(bash|sh)/.test(normalized)) {
        return 'Blocked: Piping to shell (potential remote code execution) is not allowed';
    }
    if (/dd\s+if=|mkfs|format/.test(normalized)) {
        return 'Blocked: Disk formatting or low-level disk operations are not allowed';
    }
    
    return 'Blocked: This command matches a dangerous pattern and is not allowed for safety';
}

interface ExecError extends Error {
    signal?: string;
    stderr?: Buffer | string;
    stdout?: Buffer | string;
}

export function runBash(inputObj: BashToolInput): string {
    const cmd = inputObj.command || "";
    if (!cmd) throw new Error("missing bash.command");
    
    // Enhanced dangerous command detection with detailed error messages
    if (isDangerousCommand(cmd)) {
        const errorMsg = getDangerousCommandError(cmd);
        throw new Error(errorMsg);
    }

    const isWindows = process.platform === 'win32';
    
    try {
        const result = execSync(cmd, {
            cwd: WORKDIR,
            timeout: inputObj.timeout_ms || 30000,
            encoding: 'utf-8',
            shell: isWindows ? 'powershell.exe' : undefined,
            windowsHide: true
        } as ExecSyncOptionsWithStringEncoding);
        return clampText(result.trim() || "(no output)");
    } catch (error) {
        const execError = error as ExecError;
        if (execError.signal === 'SIGTERM') return "(timeout)";
        const msg = execError.stderr?.toString() || execError.stdout?.toString() || execError.message || "(error)";
        return clampText(msg);
    }
}