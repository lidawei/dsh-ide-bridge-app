import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function run(nodeScript) {
  const result = spawnSync(process.execPath, [nodeScript], { cwd: repoRoot, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${nodeScript} failed`)
}

run(resolve(repoRoot, 'scripts/build-host.mjs'))
run(resolve(repoRoot, 'scripts/build-client.mjs'))
console.log('build: all packages ready')
