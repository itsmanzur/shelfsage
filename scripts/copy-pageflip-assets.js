import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = join(root, 'node_modules', 'page-flip', 'dist', 'js', 'page-flip.browser.js');
const targetDir = join(root, 'assets', 'pageflip');
const targetFile = join(targetDir, 'page-flip.browser.js');

if (!existsSync(sourceFile)) {
  throw new Error(
    `Missing page-flip browser bundle: ${sourceFile}\nRun: npm install page-flip`
  );
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
copyFileSync(sourceFile, targetFile);

console.log('Copied StPageFlip browser bundle to assets/pageflip');
