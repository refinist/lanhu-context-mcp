import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

if (existsSync('package.json.backup')) {
  throw new Error(
    'package.json.backup still exists — last pack did not finish cleanly. Restore manually: mv package.json.backup package.json'
  );
}

copyFileSync('package.json', 'package.json.backup');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
delete pkg.scripts.preinstall;
delete pkg.scripts.postinstall;
writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

console.log('[prepack] removed preinstall/postinstall');
