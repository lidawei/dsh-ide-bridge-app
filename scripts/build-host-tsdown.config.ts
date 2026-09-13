import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '../packages/ide-bridge')

export default defineConfig({
  entry: [resolve(packageDir, 'lib/types/index.js')],
  outDir: resolve(packageDir, 'lib'),
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  tsconfig: resolve(packageDir, 'tsconfig.standalone.json'),
  deps: { onlyBundle: false },
})
