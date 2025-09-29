import path from 'path';
import { WORKDIR } from '../config/environment';

export function safePath(p: string): string {
    const absPath = path.resolve(WORKDIR, p || "");
    const relative = path.relative(WORKDIR, absPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error("Path escapes workspace");
    }
    return absPath;
}

export function clampText(s: string, n: number = 100_000): string {
    if (s.length <= n) {
        return s;
    }
    return s.slice(0, n) + `\n\n...<truncated ${s.length - n} chars>`;
}