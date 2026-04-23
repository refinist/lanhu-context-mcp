import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.spec.ts'],
    globals: true,
    testTimeout: 30_000,
    reporters: ['tree'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/*.spec.ts',
        'src/prompts/**',
        'dist/**',
        'docs/**'
      ]
    }
  }
});
