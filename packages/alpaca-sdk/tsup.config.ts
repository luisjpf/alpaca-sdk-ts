import { defineConfig } from 'tsup'

const workspacePackages = [
  '@luisjpf/core',
  '@luisjpf/trading',
  '@luisjpf/broker',
  '@luisjpf/market-data',
  '@luisjpf/streaming',
]

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    // Bundle type declarations from workspace packages
    // This inlines the types instead of keeping external imports
    resolve: workspacePackages,
  },
  clean: true,
  splitting: true, // Enable tree-shaking
  sourcemap: true,
  minify: false,
  target: 'es2022',
  // Bundle all workspace packages into the output
  noExternal: workspacePackages,
})
