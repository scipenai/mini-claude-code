import { execSync } from 'child_process';
import { clampText } from '../utils/text-helpers';
import { WORKDIR } from '../config/environment';

export function runBash(inputObj: any): string {
    const cmd = inputObj.command || "";
    if (!cmd) {
        throw new Error("missing bash.command");
    }

    // Block dangerous commands
    if (cmd.includes("rm -rf /") || cmd.includes("shutdown") ||
        cmd.includes("reboot") || cmd.includes("sudo ")) {
        throw new Error("blocked dangerous command");
    }

    const timeoutMs = inputObj.timeout_ms || 30000;

    try {
        const result = execSync(cmd, {
            cwd: WORKDIR,
            timeout: timeoutMs,
            encoding: 'utf-8'
        });
        return clampText(result.trim() || "(no output)");
    } catch (error: any) {
        if (error.signal === 'SIGTERM') {
            return "(timeout)";
        }
        return clampText(error.message || "(error)");
    }
}