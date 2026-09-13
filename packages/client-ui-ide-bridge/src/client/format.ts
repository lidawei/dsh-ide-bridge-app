import type { IdeBridgeContext, IdeBridgeEditorView } from '@deepseek-ai/dsh-ide-bridge/types'

/** Short product label for the connected IDE host. */
export function ideDisplayLabel(context: Pick<IdeBridgeContext, 'ideId' | 'ideName'>): string {
  if (context.ideId === 'vscode') return 'VSCode'
  if (context.ideName) return context.ideName
  if (context.ideId) return context.ideId
  return 'IDE'
}

function formatPosition(line: number, column: number | null): string {
  return column === null ? String(line) : `${line}:${column}`
}

function formatFileAndRange(file: string, editor: IdeBridgeEditorView): string {
  const start = editor.line
  if (start === null) return file
  const startPos = formatPosition(start, editor.column)
  const endLine = editor.selectionEndLine
  const endColumn = editor.selectionEndColumn
  if (endLine === null || (endLine === start && (endColumn === null || endColumn === editor.column))) {
    return `${file} ${startPos}`
  }
  return `${file} ${startPos}-${formatPosition(endLine, endColumn)}`
}

/** `relativePath line:col` or `relativePath startLine:startCol-endLine:endCol`. */
export function formatEditorLocation(editor: IdeBridgeEditorView): string | null {
  const file = editor.relativePath ?? editor.path
  if (!file) return null
  return formatFileAndRange(file, editor)
}

/** Full path tooltip including line:column range. */
export function editorLocationTooltip(
  editor: IdeBridgeEditorView,
): string {
  return formatFileAndRange(editor.path ?? editor.relativePath ?? '', editor)
}

/** Connected row: `VSCode - path line:col` or `path startLine:startCol-endLine:endCol`. */
export function formatIdeBridgeLine(context: IdeBridgeContext): string {
  const label = ideDisplayLabel(context)
  const location = context.editor ? formatEditorLocation(context.editor) : null
  return location === null ? label : `${label} - ${location}`
}
