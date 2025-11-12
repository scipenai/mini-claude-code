/**
 * 简单的 YAML frontmatter 解析工具
 * 使用正则表达式提取字段，避免引入完整的 YAML 解析器依赖
 */

/**
 * 从 YAML frontmatter 中提取指定字段的值
 * 
 * @param content 文件内容
 * @param field 字段名
 * @returns 字段值，如果未找到则返回空字符串
 */
export function extractYamlField(content: string, field: string): string {
    // 匹配 "field: value" 格式
    const match = content.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    return match ? match[1].trim() : '';
}

/**
 * 检查内容是否包含有效的 YAML frontmatter
 * 
 * @param content 文件内容
 * @returns 是否包含有效的 frontmatter
 */
export function hasValidFrontmatter(content: string): boolean {
    return content.trim().startsWith('---');
}

/**
 * 提取多个字段
 * 
 * @param content 文件内容
 * @param fields 字段名数组
 * @returns 字段值对象
 */
export function extractYamlFields(content: string, fields: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const field of fields) {
        result[field] = extractYamlField(content, field);
    }
    
    return result;
}

