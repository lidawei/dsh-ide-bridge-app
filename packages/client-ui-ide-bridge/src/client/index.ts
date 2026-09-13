/** Browser entry: mount ideBridge Remote and register the composer status bar. */

import ideBridgeRemote from '@deepseek-ai/dsh-ide-bridge/remote'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-ide-bridge/remote'

import { mountIdeBridgeUi } from './mount.ts'

export { inject } from './mount.ts'
export type { IdeBridgeLocaleKey } from './locales.ts'

/** Mount Remote + UI; no harness api/remotes registration required. */
export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  return await mountIdeBridgeUi(ctx, ideBridgeRemote)
}
