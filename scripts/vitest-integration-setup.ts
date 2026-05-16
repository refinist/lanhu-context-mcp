// Vitest globalSetup hook.
// Runs ONCE before any test file. When integration mode is active, wipes the
// tmp/integration directory so each run starts from a clean slate.
import { rmSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

export default function setup(): void {
  if (process.env.RUN_INTEGRATION !== '1') return;
  const dir = resolvePath(process.cwd(), 'tmp', 'integration');
  rmSync(dir, { recursive: true, force: true });
}
