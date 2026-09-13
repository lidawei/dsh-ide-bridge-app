/** Stage the external Host package into harness, emit Typert artifacts, copy them back. */

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const { ensureHarnessLink, resolveHarnessRoot } = createRequire(import.meta.url)('./harness-root.cjs')

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
ensureHarnessLink()
const harnessRoot = resolveHarnessRoot()
const externalPackageDir = resolve(repoRoot, 'packages/ide-bridge')
const stagingPath = resolve(harnessRoot, 'packages/experimental/ide-bridge-staging')
const hostTsconfigPath = resolve(harnessRoot, 'tsconfig.host.json')
const hostRef = '{ "path": "./packages/experimental/ide-bridge-staging" }'
const marker = '{ "path": "./packages/experimental/agent-team-web-profile" },'

let hostTsconfigBackup: string | undefined

function ensureHarnessHostReference(): void {
  hostTsconfigBackup = readFileSync(hostTsconfigPath, 'utf8')
  if (hostTsconfigBackup.includes('./packages/experimental/ide-bridge-staging')) return
  if (!hostTsconfigBackup.includes(marker)) {
    throw new Error('emit-typert: cannot patch tsconfig.host.json (marker missing)')
  }
  writeFileSync(
    hostTsconfigPath,
    hostTsconfigBackup.replace(marker, `${marker}\n    ${hostRef},`),
  )
}

function restoreHarnessHostReference(): void {
  if (hostTsconfigBackup !== undefined && !hostTsconfigBackup.includes('./packages/experimental/ide-bridge-staging')) {
    writeFileSync(hostTsconfigPath, hostTsconfigBackup)
  }
}

function stagePackage(): void {
  rmSync(stagingPath, { recursive: true, force: true })
  mkdirSync(stagingPath, { recursive: true })
  for (const entry of readdirSync(externalPackageDir)) {
    if (entry === 'node_modules' || entry === 'lib') continue
    cpSync(join(externalPackageDir, entry), join(stagingPath, entry), { recursive: true })
  }
}

function cleanupStage(): void {
  rmSync(stagingPath, { recursive: true, force: true })
}

const { WorkspaceTypertGenerator } = await import(
  pathToFileURL(resolve(harnessRoot, 'packages/typert/generator/lib/types/workspace.js')).href
)

ensureHarnessHostReference()
stagePackage()
try {
  const generator = new WorkspaceTypertGenerator(harnessRoot, { checkDiagnostics: false })
  const artifacts = generator.generate(['@deepseek-ai/dsh-ide-bridge'], ['host'])
  if (artifacts.length === 0) {
    throw new Error('emit-typert: harness workspace generation returned 0 artifacts')
  }
  const output = join(externalPackageDir, 'lib')
  mkdirSync(output, { recursive: true })
  for (const artifact of artifacts) {
    writeFileSync(join(output, `typert.${artifact.face}.js`), artifact.js)
    writeFileSync(join(output, `typert.${artifact.face}.d.ts`), artifact.dts)
    if (artifact.remote !== undefined) {
      writeFileSync(join(output, 'typert.remote-client.js'), artifact.remote.js)
      writeFileSync(join(output, 'typert.remote-client.d.ts'), artifact.remote.dts)
      writeFileSync(join(output, 'typert.remote-client.d.ts.map'), artifact.remote.dtsMap)
    }
  }
  console.log(`emit-typert: wrote ${String(artifacts.length)} artifact(s) to ${output}`)
} finally {
  cleanupStage()
  restoreHarnessHostReference()
}
