import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { repoRoot, runBin } from './run-bin.mjs'

runBin('tsc', ['-p', 'packages/client-ui-ide-bridge/tsconfig.json'])
runBin('tsdown', ['-c', 'scripts/build-client-tsdown.config.ts'])
mkdirSync(resolve(repoRoot, 'packages/client-ui-ide-bridge/lib'), { recursive: true })
writeFileSync(resolve(repoRoot, 'packages/client-ui-ide-bridge/lib/index.js'), 'export function apply(){}\n')
console.log('build:client complete')
