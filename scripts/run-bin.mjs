import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Run a repo-local CLI without `pnpm exec` (avoids peer auto-install from npm). */
export function runBin(name, args, cwd = repoRoot) {
  const win = process.platform === 'win32'
  const candidates = win
    ? [resolve(repoRoot, 'node_modules', '.bin', `${name}.CMD`), resolve(repoRoot, 'node_modules', '.bin', name)]
    : [resolve(repoRoot, 'node_modules', '.bin', name)]
  const bin = candidates.find(path => existsSync(path))
  if (bin === undefined) {
    throw new Error(`run-bin: ${name} not found under ${resolve(repoRoot, 'node_modules', '.bin')}`)
  }
  const result = spawnSync(bin, args, { cwd, stdio: 'inherit', shell: win })
  if (result.status !== 0) {
    throw new Error(`${name} ${args.join(' ')} failed with ${String(result.status)}`)
  }
}

export { repoRoot }
