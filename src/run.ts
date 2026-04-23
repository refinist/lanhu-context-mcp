#!/usr/bin/env node
import module from 'node:module';
import { startServer } from './app.ts';

try {
  module.enableCompileCache?.();
} catch {}

startServer().catch(error => {
  console.error('[run] failed to start server:', error);
  process.exit(1);
});
