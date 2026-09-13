/** Wire-facing IDE editor view for dsh web clients. */

export interface IdeBridgeEditorView {
  relativePath: string | null
  path: string | null
  languageId: string | null
  line: number | null
  column: number | null
  selectionEndLine: number | null
  selectedText: string | null
}

export interface IdeBridgeContext {
  connected: boolean
  wsUrl: string | null
  lockPath: string | null
  /** Stable IDE id from lock / WS hello (e.g. `vscode`). */
  ideId: string | null
  /** Display name from lock / WS hello (e.g. `Visual Studio Code`). */
  ideName: string | null
  workspaceFolders: string[]
  revision: number
  updatedAt: string | null
  editor: IdeBridgeEditorView | null
  error: string | null
}

export interface IdeBridgeConfig {
  wsHost?: string
  lockDir?: string
  reconnectMs?: number
}
