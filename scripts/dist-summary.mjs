// Po sestavení vypíše obsah složky dist/ a co s ní dělat.
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve('dist');
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files.push({ path: relative(root, path), size: statSync(path).size });
  }
};
walk(root);

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const total = files.reduce((sum, f) => sum + f.size, 0);

console.log(`\nWeb k nasazení je ve složce: ${root}\n`);
for (const f of files.sort((a, b) => a.path.localeCompare(b.path))) {
  console.log(`  ${f.path.padEnd(32)} ${kb(f.size).padStart(10)}`);
}
console.log(`\n  ${files.length} souborů, celkem ${kb(total)}`);
console.log(`
Nahrajte CELÝ OBSAH složky dist/ na web (FTP, hosting, GitHub Pages…).
Funguje v kořeni domény i v podsložce, např. https://example.com/kviz/
Stránka pro správce: <adresa hry>#spravce
`);
