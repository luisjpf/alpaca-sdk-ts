import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: true, // Enable tree-shaking
  sourcemap: true,
  minify: false,
  target: 'es2022',
  // Bundle all workspace packages into the output
  noExternal: [
    '@luisjpf/core',
    '@luisjpf/trading',
    '@luisjpf/broker',
    '@luisjpf/market-data',
    '@luisjpf/streaming',
  ],
})
