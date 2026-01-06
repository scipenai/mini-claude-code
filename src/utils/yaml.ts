/**
 * Simple YAML frontmatter parsing utility
 * Uses regex to extract fields, avoiding full YAML parser dependency
 */

/**
 * Extract a specific field value from YAML frontmatter
 * 
 * @param content File content
 * @param field Field name
 * @returns Field value, empty string if not found
 */
export function extractYamlField(content: string, field: string): string {
    // Match "field: value" format
    const match = content.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    return match ? match[1].trim() : '';
}

/**
 * Check if content contains valid YAML frontmatter
 * 
 * @param content File content
 * @returns Whether it contains valid frontmatter
 */
export function hasValidFrontmatter(content: string): boolean {
    return content.trim().startsWith('---');
}

/**
 * Extract multiple fields
 * 
 * @param content File content
 * @param fields Array of field names
 * @returns Object with field values
 */
export function extractYamlFields(content: string, fields: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const field of fields) {
        result[field] = extractYamlField(content, field);
    }
    
    return result;
}
