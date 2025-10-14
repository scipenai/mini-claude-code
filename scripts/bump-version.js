#!/usr/bin/env node

/**
 * Version Bump Script
 * Automatically update version number in package.json
 * 
 * Usage:
 *   npm run version:patch  # 0.5.0 -> 0.5.1
 *   npm run version:minor  # 0.5.0 -> 0.6.0
 *   npm run version:major  # 0.5.0 -> 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const versionType = args[0] || 'patch'; // patch, minor, major

// Validate version type
if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error(`❌ Invalid version type: ${versionType}`);
    console.error('   Valid types: patch, minor, major');
    process.exit(1);
}

// Read package.json
const packageJsonPath = path.join(__dirname, '../package.json');
let packageJson;

try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
} catch (error) {
    console.error('❌ Failed to read package.json:', error.message);
    process.exit(1);
}

// Parse current version
const currentVersion = packageJson.version || '0.0.0';
const versionParts = currentVersion.split('.').map(Number);

if (versionParts.length !== 3 || versionParts.some(isNaN)) {
    console.error(`❌ Invalid version format: ${currentVersion}`);
    process.exit(1);
}

let [major, minor, patch] = versionParts;

// Bump version based on type
switch (versionType) {
    case 'major':
        major += 1;
        minor = 0;
        patch = 0;
        break;
    case 'minor':
        minor += 1;
        patch = 0;
        break;
    case 'patch':
        patch += 1;
        break;
}

const newVersion = `${major}.${minor}.${patch}`;

// Update package.json
packageJson.version = newVersion;

try {
    fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + '\n',
        'utf-8'
    );
} catch (error) {
    console.error('❌ Failed to write package.json:', error.message);
    process.exit(1);
}

console.log(`✅ Version bumped: ${currentVersion} → ${newVersion}`);

// Check if git is available and this is a git repository
let isGitRepo = false;
try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    isGitRepo = true;
} catch (error) {
    // Not a git repository
}

if (isGitRepo) {
    console.log('\n📝 Git commands (optional):');
    console.log(`   git add package.json`);
    console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
    console.log(`   git tag v${newVersion}`);
    console.log(`   git push && git push --tags`);
}

console.log('\n🎉 Done!');

