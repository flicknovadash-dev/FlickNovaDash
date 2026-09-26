import { copyFile, mkdir, readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const files = ['index.html', 'styles.css', 'app.js', 'robots.txt', 'sitemap.xml', 'assets/orbit-symbol.webp', 'assets/game-icon.jpg', 'assets/gameplay-story.mp4', 'assets/story-poster.jpg', 'assets/gameplay.vtt'];
const html = await readFile(resolve(root, 'index.html'), 'utf8');
for (const [, target] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (!/^(?:https?:|#|data:)/.test(target)) await access(resolve(root, target));
}
for (const file of files) {
  const output = resolve(root, 'out', file);
  await mkdir(dirname(output), { recursive: true });
  await copyFile(resolve(root, file), output);
}
console.log(`Prepared ${files.length} static files in out; local asset references verified.`);
