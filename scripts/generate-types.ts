#!/usr/bin/env tsx
/**
 * Generate TypeScript types from OpenAPI specifications
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

interface SpecConfig {
  input: string
  output: string
  packageDir: string
}

const specs: SpecConfig[] = [
  {
    input: 'specs/trading-api.json',
    output: 'packages/trading/src/generated/trading-api.d.ts',
    packageDir: 'packages/trading/src/generated',
  },
  {
    input: 'specs/broker-api.json',
    output: 'packages/broker/src/generated/broker-api.d.ts',
    packageDir: 'packages/broker/src/generated',
  },
  {
    input: 'specs/market-data-api.json',
    output: 'packages/market-data/src/generated/market-data-api.d.ts',
    packageDir: 'packages/market-data/src/generated',
  },
]

function ensureDir(dir: string): void {
  const fullPath = join(rootDir, dir)
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true })
    console.log(`Created directory: ${dir}`)
  }
}

function generateTypes(spec: SpecConfig): void {
  ensureDir(spec.packageDir)

  const inputPath = join(rootDir, spec.input)
  const outputPath = join(rootDir, spec.output)

  console.log(`Generating types from ${spec.input}...`)

  try {
    execSync(`npx openapi-typescript "${inputPath}" -o "${outputPath}"`, {
      cwd: rootDir,
      stdio: 'inherit',
    })
    console.log(`✓ Generated ${spec.output}`)
  } catch (error) {
    console.error(`✗ Failed to generate ${spec.output}`)
    throw error
  }
}

async function main(): Promise<void> {
  console.log('Generating TypeScript types from OpenAPI specs...\n')

  for (const spec of specs) {
    generateTypes(spec)
  }

  console.log('\n✓ All types generated successfully!')
}

main().catch((error: unknown) => {
  console.error('Type generation failed:', error)
  process.exit(1)
})
