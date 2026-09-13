/**
 * Compile-time harness checkout is the repo-root `./harness` symlink.
 * Optional DSH_HARNESS_ROOT only creates/refreshes that symlink.
 */
const { existsSync, lstatSync, realpathSync, rmSync, symlinkSync } = require('node:fs')
const { resolve } = require('node:path')

const repoRoot = resolve(__dirname, '..')
const harnessLinkDir = resolve(repoRoot, 'harness')

function resolveHarnessRoot() {
  if (!existsSync(harnessLinkDir)) {
    throw new Error(
      'Missing ./harness. Clone deepseek-harness and point a symlink here, e.g.\n' +
        '  New-Item -ItemType Junction -Path harness -Target <path-to-deepseek-harness>',
    )
  }
  try {
    const real = realpathSync(harnessLinkDir)
    if (existsSync(real)) return real
  } catch { /* broken link */ }
  throw new Error('./harness is broken. Recreate the symlink to your deepseek-harness checkout.')
}

function ensureHarnessLink() {
  if (process.env.DSH_HARNESS_ROOT) {
    const target = resolve(process.env.DSH_HARNESS_ROOT)
    if (!existsSync(target)) {
      throw new Error(`DSH_HARNESS_ROOT does not exist: ${target}`)
    }
    const targetReal = realpathSync(target)
    if (existsSync(harnessLinkDir)) {
      try {
        if (realpathSync(harnessLinkDir) === targetReal) return harnessLinkDir
      } catch { /* broken link */ }
      if (!lstatSync(harnessLinkDir).isSymbolicLink()) {
        throw new Error(`${harnessLinkDir} exists and is not a symlink. Move it aside.`)
      }
      rmSync(harnessLinkDir, { force: true })
    }
    symlinkSync(target, harnessLinkDir, process.platform === 'win32' ? 'junction' : 'dir')
    return harnessLinkDir
  }
  resolveHarnessRoot()
  return harnessLinkDir
}

module.exports = {
  repoRoot,
  harnessLinkDir,
  resolveHarnessRoot,
  ensureHarnessLink,
}
