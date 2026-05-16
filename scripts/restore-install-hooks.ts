import { existsSync, renameSync } from 'node:fs';

if (existsSync('package.json.backup')) {
  renameSync('package.json.backup', 'package.json');
  console.log('[postpack] restored package.json');
}
