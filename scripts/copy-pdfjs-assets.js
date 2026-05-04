import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(root, 'node_modules', 'pdfjs-dist');
const targetRoot = join(root, 'assets', 'pdfjs');

function assertExists(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing PDF.js asset: ${path}`);
  }
}

function copyTree(from, to) {
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

assertExists(join(sourceRoot, 'build', 'pdf.min.js'));
assertExists(join(sourceRoot, 'build', 'pdf.worker.js'));
assertExists(join(sourceRoot, 'cmaps'));

rmSync(targetRoot, { recursive: true, force: true });
mkdirSync(targetRoot, { recursive: true });

copyFileSync(join(sourceRoot, 'build', 'pdf.min.js'), join(targetRoot, 'pdf.min.js'));
copyFileSync(join(sourceRoot, 'build', 'pdf.worker.js'), join(targetRoot, 'pdf.worker.js'));
copyTree(join(sourceRoot, 'cmaps'), join(targetRoot, 'cmaps'));

console.log('Copied PDF.js assets to assets/pdfjs');
