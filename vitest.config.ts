import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node', 
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 85,
      },
    },
  },
});