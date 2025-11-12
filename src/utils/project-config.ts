import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { STORAGE_DIR, WORKDIR } from '../config/environment';

/**
 * Project configuration interface
 */
export interface ProjectConfig {
    hasCompletedProjectOnboarding?: boolean;
    dontCrawlDirectory?: boolean;
    context?: Record<string, string>;
}

/**
 * Project configuration file path
 */
const PROJECT_CONFIG_FILE = join(STORAGE_DIR, 'project-config.json');

/**
 * Get current project configuration
 */
export function getCurrentProjectConfig(): ProjectConfig {
    try {
        if (!existsSync(PROJECT_CONFIG_FILE)) {
            return {};
        }
        const content = readFileSync(PROJECT_CONFIG_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.warn('Failed to load project config, using defaults');
        return {};
    }
}

/**
 * Save project configuration
 */
export function saveProjectConfig(config: ProjectConfig): void {
    try {
        // Ensure storage directory exists
        if (!existsSync(STORAGE_DIR)) {
            mkdirSync(STORAGE_DIR, { recursive: true });
        }
        
        writeFileSync(PROJECT_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error('Failed to save project config:', error);
        throw error;
    }
}

/**
 * Mark project onboarding as complete
 */
export function markProjectOnboardingComplete(): void {
    const config = getCurrentProjectConfig();
    if (!config.hasCompletedProjectOnboarding) {
        saveProjectConfig({
            ...config,
            hasCompletedProjectOnboarding: true,
        });
    }
}

/**
 * Check if project has AGENTS.md file
 */
export function hasProjectGuide(): boolean {
    return existsSync(join(WORKDIR, 'AGENTS.md')) || existsSync(join(WORKDIR, 'CLAUDE.md'));
}

/**
 * Check if should show onboarding
 */
export function shouldShowOnboarding(): boolean {
    const config = getCurrentProjectConfig();
    return !config.hasCompletedProjectOnboarding && !hasProjectGuide();
}

