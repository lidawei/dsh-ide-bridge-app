import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { repoRoot, runBin } from './run-bin.mjs'

runBin('tsc', ['-p', 'packages/ide-bridge/tsconfig.standalone.json'])
runBin('tsx', ['scripts/emit-typert.ts'])
runBin('tsdown', ['-c', 'scripts/build-host-tsdown.config.ts'])
runBin('tsc', ['-p', 'packages/ide-bridge-app/tsconfig.json'])
mkdirSync(resolve(repoRoot, 'packages/ide-bridge-app/lib'), { recursive: true })
writeFileSync(resolve(repoRoot, 'packages/ide-bridge-app/lib/index.js'), 'export {}\n')
console.log('build:host complete')
