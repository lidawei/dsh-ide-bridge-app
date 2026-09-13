import type { IdeBridgeEditorView } from './types.ts'

interface EditorPosition {
  line?: number
  character?: number
  column?: number
}

interface EditorSelectionWire {
  start?: EditorPosition
  end?: EditorPosition
  isEmpty?: boolean
  text?: string
}

interface EditorFileWire {
  relativePath?: string
  path?: string
  languageId?: string
  viewColumn?: number
  selection?: EditorSelectionWire | null
}

interface EditorSliceData {
  activeFile?: EditorFileWire | null
  selection?: EditorSelectionWire | null
  visibleEditors?: EditorFileWire[]
}

interface SourceSlice {
  status?: string
  data?: EditorSliceData
}

interface IdeSnapshot {
  sources?: { editor?: SourceSlice }
}

function toOneBasedLine(line: number | undefined): number | null {
  return typeof line === 'number' ? line + 1 : null
}

/** Prefer wire `column` (1-based); fall back to VS Code `character` (0-based). */
function toOneBasedColumn(pos: EditorPosition | undefined): number | null {
  if (typeof pos?.column === 'number') {
    return pos.column
  }
  if (typeof pos?.character === 'number') {
    return pos.character + 1
  }
  return null
}

function mapEditor(data: EditorSliceData | undefined): IdeBridgeEditorView | null {
  if (!data?.activeFile) {
    return null
  }
  const file = data.activeFile
  const selection = data.selection ?? file.selection
  const hasRange = Boolean(selection && !selection.isEmpty)

  return {
    relativePath: file.relativePath ?? null,
    path: file.path ?? null,
    languageId: file.languageId ?? null,
    line: toOneBasedLine(selection?.start?.line),
    column: toOneBasedColumn(selection?.start),
    selectionEndLine: hasRange ? toOneBasedLine(selection?.end?.line) : null,
    selectionEndColumn: hasRange ? toOneBasedColumn(selection?.end) : null,
    selectedText: selection?.text ?? null,
  }
}

export function editorFromSnapshot(snapshot: IdeSnapshot): IdeBridgeEditorView | null {
  const slice = snapshot.sources?.editor
  if (!slice || slice.status === 'disabled' || slice.status === 'error') {
    return null
  }
  return mapEditor(slice.data)
}

export function editorFromEventSlice(slice: SourceSlice): IdeBridgeEditorView | null {
  if (slice.status === 'disabled' || slice.status === 'error') {
    return null
  }
  return mapEditor(slice.data)
}
