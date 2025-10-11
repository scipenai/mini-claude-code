import { execSync } from 'child_process';
import { clampText } from '../utils/text-helpers';
import { WORKDIR } from '../config/environment';

const DANGEROUS_PATTERNS = {
    win32: ['format ', 'del /s', 'rmdir /s', 'rd /s', 'shutdown', 'restart-computer', 
            'remove-item -recurse', 'rm -recurse', 'diskpart', 'reg delete'],
    unix: ['rm -rf /', 'rm -rf /*', 'shutdown', 'reboot', 'mkfs', 'dd if=', 'sudo ']
};

function isDangerousCommand(cmd: string): boolean {
    const patterns = process.platform === 'win32' ? DANGEROUS_PATTERNS.win32 : DANGEROUS_PATTERNS.unix;
    return patterns.some(p => cmd.toLowerCase().includes(p));
}

export function runBash(inputObj: any): string {
    const cmd = inputObj.command || "";
    if (!cmd) throw new Error("missing bash.command");
    if (isDangerousCommand(cmd)) throw new Error("blocked dangerous command");

    const isWindows = process.platform === 'win32';
    
    try {
        const result = execSync(cmd, {
            cwd: WORKDIR,
            timeout: inputObj.timeout_ms || 30000,
            encoding: 'utf-8',
            shell: isWindows ? 'powershell.exe' : undefined,
            windowsHide: true
        });
        return clampText(result.trim() || "(no output)");
    } catch (error: any) {
        if (error.signal === 'SIGTERM') return "(timeout)";
        const msg = error.stderr?.toString() || error.stdout?.toString() || error.message || "(error)";
        return clampText(msg);
    }
}