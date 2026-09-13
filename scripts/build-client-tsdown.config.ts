/**
 * Browser client bundle for @deepseek-ai/dsh-client-ui-ide-bridge.
 * Standalone tsdown config (no harness workspace manifest lookup).
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'
import { transform } from 'lightningcss'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageDir = resolve(repoRoot, 'packages/client-ui-ide-bridge')
const packageId = '@deepseek-ai/dsh-client-ui-ide-bridge'
const entry = resolve(packageDir, 'lib/types/client/index.js')

const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'
const SOURCE_MARKER = `${sep}src${sep}`
const TYPES_MARKER = `${sep}lib${sep}types${sep}`

const REQUESTED_EXTERNALS = new Set([
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-api-remotes',
  '@deepseek-ai/dsh-api-remotes/client',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-locale/client',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-conversation/client',
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-client-ui-renderer/client',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-typert-protocol',
  'react',
  'react/jsx-runtime',
])

function isBareSpecifier(specifier: string): boolean {
  return !specifier.startsWith('.') && !specifier.startsWith('\0') && !isAbsolute(specifier)
}

function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolve(dirname(importer), source)
  if (existsSync(emitted)) return emitted
  const boundary = emitted.indexOf(TYPES_MARKER)
  if (boundary < 0) return emitted
  return resolve(emitted.slice(0, boundary), 'src', emitted.slice(boundary + TYPES_MARKER.length))
}

function styleInjectionModule(fileId: string, css: string, classMap?: Readonly<Record<string, string>>): string {
  const source = [
    `const css = ${JSON.stringify(css)};`,
    `const tagId = ${JSON.stringify(`${packageId}/${fileId.split(/[/\\]/).pop()}`)};`,
    'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
    '  const tag = document.createElement(\'style\');',
    `  tag.dataset.plugin = ${JSON.stringify(packageId)};`,
    '  tag.dataset.pluginCss = tagId;',
    '  tag.textContent = css;',
    '  document.head.appendChild(tag);',
    '}',
  ]
  source.push(classMap === undefined ? 'export {};' : `export default ${JSON.stringify(classMap)};`)
  return source.join('\n')
}

export default defineConfig({
  name: `${packageId}/client`,
  entry: { client: entry },
  outDir: resolve(packageDir, 'lib'),
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: (specifier: string) => REQUESTED_EXTERNALS.has(specifier),
    alwaysBundle: (specifier: string) => !REQUESTED_EXTERNALS.has(specifier),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  inputOptions: {
    resolve: {
      alias: {
        zod: resolve(repoRoot, 'node_modules/zod'),
      },
    },
  },
  plugins: [{
    name: 'resolve-zod',
    resolveId(source: string) {
      if (source !== 'zod') return null
      return resolve(repoRoot, 'node_modules/zod/index.js')
    },
  }, {
    name: 'dsh-client-bundle-purity',
    resolveId(source: string) {
      if (!source.startsWith('@deepseek-ai/')) return null
      if (REQUESTED_EXTERNALS.has(source)) return null
      if (/^@deepseek-ai\/dsh-[a-z0-9-]+\/remote$/.test(source)) return null
      throw new Error(`client bundle purity: "${source}" must stay external or be a generated /remote contribution`)
    },
  }, {
    name: 'dsh-tsc-sourcemap',
    async load(id: string) {
      if (!id.includes(TYPES_MARKER) || !id.endsWith('.js') || !existsSync(`${id}.map`)) return null
      const code = await readFile(id, 'utf8')
      const map = JSON.parse(await readFile(`${id}.map`, 'utf8')) as {
        sources?: unknown
        sourcesContent?: unknown
        [key: string]: unknown
      }
      if (!Array.isArray(map.sources)) return null
      const sourcesContent = Array.isArray(map.sourcesContent) ? [...map.sourcesContent] : []
      const normalized: string[] = []
      for (let index = 0; index < map.sources.length; index++) {
        const source = map.sources[index]
        if (typeof source !== 'string' || !source.startsWith('.')) {
          normalized.push(typeof source === 'string' ? source : String(source))
          continue
        }
        const physical = resolve(dirname(id), source)
        const repoRelative = relative(repoRoot, physical).split(sep).join('/')
        try {
          sourcesContent[index] = await readFile(physical, 'utf8')
        } catch { /* keep existing */ }
        normalized.push(repoRelative.startsWith('packages/') ? `../../../${repoRelative}` : source)
      }
      return {
        code,
        map: { ...map, sources: normalized, sourcesContent },
      }
    },
  }, {
    name: 'dsh-css-modules-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css') || importer === undefined) return null
      const abs = sourceAssetPath(source, importer)
      return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({
        filename: fileId,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap: Record<string, string> = {}
      for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
      return styleInjectionModule(fileId, code.toString(), classMap)
    },
  }],
  outputOptions: {
    entryFileNames: 'client.js',
    sourcemapExcludeSources: false,
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(packageId)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
