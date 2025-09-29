export function prettyToolLine(kind: string, title: string | null): void {
    console.log(`⏺ ${kind}(${title})…`);
}

export function prettySubLine(text: string): void {
    console.log(`  ⎿ ${text}`);
}

export function logErrorDebug(tag: string, info: any): void {
    try {
        const js = JSON.stringify(info, null, 2);
        const out = js.length <= 4000 ? js : js.slice(0, 4000) + "\n...<truncated>";
        console.log(`⚠️  ${tag}:`);
        console.log(out);
    } catch (e) {
        console.log(`⚠️  ${tag}: (unserializable info)`);
    }
}