export function clampText(s: string, n: number = 100_000): string {
    if (s.length <= n) {
        return s;
    }
    return s.slice(0, n) + `\n\n...<truncated ${s.length - n} chars>`;
}