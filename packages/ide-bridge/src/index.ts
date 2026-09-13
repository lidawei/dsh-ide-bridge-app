/**
 * Host plugin connecting dsh web to the dsh-ide-vscode WebSocket bridge.
 * @module @deepseek-ai/dsh-ide-bridge
 */

import type { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from 'zod'

import { findNewestLock, formatUserHomePath, resolveIdeLockDir } from './lock-scanner.ts'
import { formatIdePromptContext } from './prompt-context.ts'
import type { IdeBridgeConfig, IdeBridgeContext } from './types.ts'
import { IdeWsClient } from './ws-client.ts'

export type * from './types.ts'

export function resolveConfig(config: IdeBridgeConfig = {}): Required<IdeBridgeConfig> {
  return {
    wsHost: config.wsHost?.trim() || process.env.DSH_IDE_WS_HOST?.trim() || '127.0.0.1',
    lockDir: config.lockDir?.trim() || '',
    reconnectMs: config.reconnectMs ?? 2_000,
  }
}

const emptyContext = (): IdeBridgeContext => ({
  connected: false,
  wsUrl: null,
  lockPath: null,
  ideId: null,
  ideName: null,
  workspaceFolders: [],
  revision: 0,
  updatedAt: null,
  editor: null,
  error: null,
})

export class IdeBridgeService extends TypertRemoteService {
  private state: IdeBridgeContext = emptyContext()
  private client: IdeWsClient | undefined
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private readonly config: Required<IdeBridgeConfig>

  constructor(ctx: Context, pluginConfig: IdeBridgeConfig = {}) {
    super(ctx, 'ideBridge')
    this.config = resolveConfig(pluginConfig)

    ctx.inject(['systemPrompt'], (scope) => {
      scope.systemPrompt.context({
        name: 'ide:editor',
        order: 125,
        text: () => formatIdePromptContext(this.state),
      })
    })

    ctx.effect(() => {
      this.connectLoop()
      return () => {
        if (this.reconnectTimer !== undefined) {
          clearTimeout(this.reconnectTimer)
        }
        this.client?.close()
        this.client = undefined
        this.state = emptyContext()
      }
    }, 'ide-bridge: ws lifecycle')
  }

  /** @returns live VS Code editor file/line from the IDE bridge WS. */
  @Remote('getContext')
  getContext(): IdeBridgeContext {
    return this.state
  }

  private connectLoop(): void {
    this.client?.close()
    this.client = undefined

    const lockDir = resolveIdeLockDir(this.config.lockDir || undefined)
    const found = findNewestLock(lockDir)
    if (!found) {
      this.state = { ...emptyContext(), error: `No IDE lock file in ${formatUserHomePath(lockDir)}` }
      this.scheduleReconnect()
      return
    }

    this.client = new IdeWsClient({
      wsUrl: `ws://${this.config.wsHost}:${found.lock.port}`,
      authToken: found.lock.authToken,
      lockPath: found.lockPath,
      workspaceFolders: found.lock.workspaceFolders ?? [],
      ideId: found.lock.ideId ?? null,
      ideName: found.lock.ideName ?? null,
      onChange: (patch) => {
        this.state = { ...this.state, ...patch }
        if (patch.connected === false) {
          this.scheduleReconnect()
        }
      },
    })
    this.client.connect()
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer)
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      if (!this.state.connected) {
        this.connectLoop()
      }
    }, this.config.reconnectMs)
  }
}

export default IdeBridgeService
