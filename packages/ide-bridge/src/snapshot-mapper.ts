import type { IdeBridgeEditorView } from './types.ts'

interface EditorSliceData {
  activeFile?: { relativePath?: string, path?: string, languageId?: string } | null
  selection?: {
    start?: { line?: number, character?: number }
    end?: { line?: number, character?: number }
    isEmpty?: boolean
    text?: string
  } | null
}

interface SourceSlice {
  status?: string
  data?: EditorSliceData
}

interface IdeSnapshot {
  sources?: { editor?: SourceSlice }
}

function mapEditor(data: EditorSliceData | undefined): IdeBridgeEditorView | null {
  if (!data?.activeFile) {
    return null
  }
  const file = data.activeFile
  const selection = data.selection
  const line = selection?.start?.line
  const column = selection?.start?.character

  return {
    relativePath: file.relativePath ?? null,
    path: file.path ?? null,
    languageId: file.languageId ?? null,
    line: typeof line === 'number' ? line + 1 : null,
    column: typeof column === 'number' ? column + 1 : null,
    selectionEndLine:
      selection && !selection.isEmpty && typeof selection.end?.line === 'number'
        ? selection.end.line + 1
        : null,
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
