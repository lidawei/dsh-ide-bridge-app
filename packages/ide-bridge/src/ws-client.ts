import WebSocket from 'ws'

import { editorFromEventSlice, editorFromSnapshot } from './snapshot-mapper.ts'
import type { IdeBridgeContext, IdeBridgeEditorView } from './types.ts'

type ServerMessage =
  | { type: 'hello', ideId?: string, ideName?: string }
  | { type: 'snapshot', revision: number, snapshot: unknown }
  | { type: 'event', revision: number, sourceId: string, slice: unknown }

export interface IdeWsClientOptions {
  wsUrl: string
  authToken: string
  lockPath: string
  workspaceFolders: string[]
  ideId: string | null
  ideName: string | null
  onChange: (patch: Partial<IdeBridgeContext>) => void
}

export class IdeWsClient {
  private socket: WebSocket | undefined
  private closed = false
  private revision = 0
  private editor: IdeBridgeEditorView | null = null

  constructor(private readonly options: IdeWsClientOptions) {}

  connect(): void {
    this.closed = false
    this.socket = new WebSocket(this.options.wsUrl)

    this.socket.on('open', () => {
      this.socket?.send(JSON.stringify({ type: 'auth', token: this.options.authToken }))
      this.options.onChange({
        connected: true,
        wsUrl: this.options.wsUrl,
        lockPath: this.options.lockPath,
        ideId: this.options.ideId,
        ideName: this.options.ideName,
        workspaceFolders: this.options.workspaceFolders,
        error: null,
      })
    })

    this.socket.on('message', (data: WebSocket.RawData) => {
      let message: ServerMessage
      try {
        message = JSON.parse(String(data)) as ServerMessage
      } catch {
        return
      }

      if (message.type === 'hello') {
        const patch: Partial<IdeBridgeContext> = {}
        if (typeof message.ideId === 'string') patch.ideId = message.ideId
        if (typeof message.ideName === 'string') patch.ideName = message.ideName
        if (Object.keys(patch).length > 0) this.options.onChange(patch)
        return
      }

      if (message.type === 'snapshot') {
        this.revision = message.revision
        this.editor = editorFromSnapshot(message.snapshot as never)
        this.emitState()
        return
      }

      if (message.type === 'event' && message.sourceId === 'editor') {
        this.revision = message.revision
        this.editor = editorFromEventSlice(message.slice as never)
        this.emitState()
      }
    })

    this.socket.on('close', () => {
      if (!this.closed) {
        this.options.onChange({ connected: false, error: 'WebSocket closed' })
      }
    })

    this.socket.on('error', (err: Error) => {
      this.options.onChange({ connected: false, error: String(err) })
    })
  }

  close(): void {
    this.closed = true
    this.socket?.close(1000)
    this.socket = undefined
  }

  private emitState(): void {
    this.options.onChange({
      connected: true,
      revision: this.revision,
      updatedAt: new Date().toISOString(),
      editor: this.editor,
      error: null,
    })
  }
}
