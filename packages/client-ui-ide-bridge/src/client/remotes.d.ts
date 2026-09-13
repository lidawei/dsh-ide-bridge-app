import type { IdeBridgeContext } from '@deepseek-ai/dsh-ide-bridge'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'

declare module '@deepseek-ai/dsh-api-remotes/client' {
  interface ClientRemote {
    ideBridge: {
      getContext(): Promise<RemoteResult<IdeBridgeContext>>
    }
  }
}

export {}
