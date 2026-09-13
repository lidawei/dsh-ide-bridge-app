import type { IdeBridgeContext, IdeBridgeEditorView } from './types.ts'

const MAX_SELECTED_CHARS = 4_000

function formatPosition(line: number, column: number | null): string {
  return column === null ? String(line) : `${line}:${column}`
}

function formatRange(editor: IdeBridgeEditorView): string | null {
  const start = editor.line
  if (start === null) return null
  const startPos = formatPosition(start, editor.column)
  const endLine = editor.selectionEndLine
  const endColumn = editor.selectionEndColumn
  if (endLine === null || (endLine === start && (endColumn === null || endColumn === editor.column))) {
    return startPos
  }
  return `${startPos}-${formatPosition(endLine, endColumn)}`
}

/** Empty string when disconnected or no file — systemPrompt then contributes nothing. */
export function formatIdePromptContext(context: IdeBridgeContext): string {
  if (!context.connected || context.editor === null) return ''
  const editor = context.editor
  const file = editor.relativePath ?? editor.path
  if (!file) return ''
  const range = formatRange(editor)
  const lines = [
    range === null
      ? `The user's IDE focus is ${file}.`
      : `The user's IDE focus is ${file} at ${range} (1-based).`,
  ]
  const selected = editor.selectedText?.trim()
  if (selected) {
    const clipped = selected.length > MAX_SELECTED_CHARS
      ? `${selected.slice(0, MAX_SELECTED_CHARS)}…`
      : selected
    lines.push(clipped === selected ? 'Selected text:' : 'Selected text (truncated):', clipped)
  }
  return lines.join('\n')
}
