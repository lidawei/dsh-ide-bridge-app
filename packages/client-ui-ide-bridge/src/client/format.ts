import type { IdeBridgeContext, IdeBridgeEditorView } from '@deepseek-ai/dsh-ide-bridge/types'

/** Short product label for the connected IDE host. */
export function ideDisplayLabel(context: Pick<IdeBridgeContext, 'ideId' | 'ideName'>): string {
  if (context.ideId === 'vscode') return 'VSCode'
  if (context.ideName) return context.ideName
  if (context.ideId) return context.ideId
  return 'IDE'
}

/** `relativePath startLine:endLine` for the composer dock row. */
export function formatEditorLocation(editor: IdeBridgeEditorView): string | null {
  const file = editor.relativePath ?? editor.path
  if (!file) return null
  const start = editor.line
  if (start === null) return file
  const end = editor.selectionEndLine ?? start
  return `${file} ${start}:${end}`
}

/** Full path tooltip including line range. */
export function editorLocationTooltip(
  editor: IdeBridgeEditorView,
): string {
  const file = editor.path ?? editor.relativePath ?? ''
  const start = editor.line
  if (start === null) return file
  const end = editor.selectionEndLine ?? start
  return `${file} ${start}:${end}`
}

/** Connected row: `VSCode - path start:end`. */
export function formatIdeBridgeLine(context: IdeBridgeContext): string {
  const label = ideDisplayLabel(context)
  const location = context.editor ? formatEditorLocation(context.editor) : null
  return location === null ? label : `${label} - ${location}`
}
