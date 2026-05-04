import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pluginSlug = 'shelfsage';
const distDir = join(root, 'dist');
const stageDir = join(distDir, pluginSlug);
const zipPath = join(distDir, `${pluginSlug}.zip`);

const excludedDirs = new Set([
  '.git',
  '.github',
  '.idea',
  '.vscode',
  '.cursor',
  'dist',
  'node_modules',
  'scripts',
  'src',
  'tools',
]);

const excludedFiles = new Set([
  '.DS_Store',
  '.gitignore',
  'package-lock.json',
  'package.json',
  'postcss.config.js',
  'tailwind.config.js',
  'vite.config.js',
]);

const excludedExtensions = new Set([
  '.map',
]);

/** Dev-only or backup filenames — never ship in the WordPress plugin zip. */
const excludedNamePatterns = [
  /^api-legacy-monolith\.pre-section2\.php$/i,
  /^_build-.*\.js$/i,
  /^_rebuild-.*\.js$/i,
  /^shelfsage-audit-report\.md$/i,
];

function shouldExclude(path) {
  const rel = relative(root, path).replace(/\\/g, '/');
  const name = basename(path);

  if (!rel || rel === '..') {
    return false;
  }

  if (excludedFiles.has(name)) {
    return true;
  }

  for (const re of excludedNamePatterns) {
    if (re.test(name)) {
      return true;
    }
  }

  const dotIndex = name.lastIndexOf('.');
  if (dotIndex !== -1 && excludedExtensions.has(name.slice(dotIndex))) {
    return true;
  }

  return rel.split('/').some((part) => excludedDirs.has(part));
}

function copyTree(from, to) {
  if (shouldExclude(from)) {
    return;
  }

  const stat = statSync(from);
  if (stat.isDirectory()) {
    mkdirSync(to, { recursive: true });
    for (const entry of readdirSync(from)) {
      copyTree(join(from, entry), join(to, entry));
    }
    return;
  }

  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}

rmSync(stageDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(stageDir, { recursive: true });

for (const entry of readdirSync(root)) {
  copyTree(join(root, entry), join(stageDir, entry));
}

// Packaging bug fix: nested templates/templates/ must not ship twice.
const dupTemplates = join(stageDir, 'templates', 'templates');
if (existsSync(dupTemplates)) {
  rmSync(dupTemplates, { recursive: true, force: true });
  console.log('Removed duplicate templates/templates/ from release.');
}

if (!existsSync(join(stageDir, 'shelfsage.php'))) {
  throw new Error('Release staging failed: shelfsage.php was not copied.');
}

execFileSync(
  'powershell',
  [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `Compress-Archive -Path '${stageDir.replace(/'/g, "''")}' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`,
  ],
  { stdio: 'inherit' }
);

console.log(`Created ${zipPath}`);
