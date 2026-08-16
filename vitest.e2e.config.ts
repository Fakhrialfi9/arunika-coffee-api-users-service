import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    globals: true,

    environment: 'node',

    include: ['test/**/*.e2e-spec.ts'],

    exclude: [
      'test/users-resilience.e2e-spec.ts',
      'test/users-internal-failure.e2e-spec.ts',
    ],

    clearMocks: true,

    restoreMocks: true,

    mockReset: true,

    testTimeout: 15_000,

    hookTimeout: 15_000,
  },
});
