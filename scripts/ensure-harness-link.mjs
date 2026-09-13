/** Require ./harness, or create it when DSH_HARNESS_ROOT is set. */

import { createRequire } from 'node:module'

const { ensureHarnessLink, resolveHarnessRoot } = createRequire(import.meta.url)('./harness-root.cjs')

const link = ensureHarnessLink()
console.log(`harness → ${resolveHarnessRoot()} (${link})`)
