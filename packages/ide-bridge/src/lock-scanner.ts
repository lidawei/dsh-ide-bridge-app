import * as fs from 'node:fs'
import * as path from 'node:path'

import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'

export interface IdeLockFile {
  pid: number
  port: number
  workspaceFolders: string[]
  authToken: string
  ideId?: string
  ideName?: string
}

export function resolveIdeLockDir(configured?: string): string {
  if (configured?.trim()) {
    return path.resolve(configured.trim())
  }
  const override = process.env.DSH_IDE_LOCK_DIR?.trim()
  if (override) {
    return path.resolve(override)
  }
  return path.join(resolveDshHome(), 'ide')
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function findNewestLock(lockDir: string): { lockPath: string, lock: IdeLockFile } | null {
  if (!fs.existsSync(lockDir)) {
    return null
  }

  const entries = fs.readdirSync(lockDir)
    .filter(name => name.endsWith('.lock'))
    .map(name => path.join(lockDir, name))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs)

  for (const lockPath of entries) {
    try {
      const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as IdeLockFile
      if (typeof lock.port !== 'number' || typeof lock.authToken !== 'string') {
        continue
      }
      if (typeof lock.pid === 'number' && !isPidAlive(lock.pid)) {
        continue
      }
      return { lockPath, lock }
    } catch {
      continue
    }
  }

  return null
}
