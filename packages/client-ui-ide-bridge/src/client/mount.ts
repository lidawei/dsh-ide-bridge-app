/** Client-side Remote mount and slot registration for the IDE bridge bar. */

import type { IdeBridgeContext } from '@deepseek-ai/dsh-ide-bridge/types'
import type {} from '@deepseek-ai/dsh-ide-bridge/remote'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'

import { IdeBridgeBar } from './IdeBridgeBar.tsx'
import { en, zh, type IdeBridgeLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    ideBridge: IdeBridgeLocaleKey
  }
}

export type { IdeBridgeLocaleKey } from './locales.ts'

const NS = 'ideBridge'

export interface IdeBridgeBarInjected {
  getContext: () => Promise<IdeBridgeContext>
}

/** Required browser services before Remote mount. */
export const inject = ['remote', 'slots', 'locale']

function registerUi(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-ide-bridge: dictionaries')

  const getContext = async (): Promise<IdeBridgeContext> => {
    const empty = (error: string): IdeBridgeContext => ({
      connected: false,
      wsUrl: null,
      lockPath: null,
      ideId: null,
      ideName: null,
      workspaceFolders: [],
      revision: 0,
      updatedAt: null,
      editor: null,
      error,
    })
    try {
      const result = await ctx.remote.ideBridge.getContext()
      if (!result.ok) return empty(`${result.error.code}: ${result.error.message}`)
      return result.value
    } catch (error) {
      return empty(error instanceof Error ? error.message : String(error))
    }
  }

  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
    name: 'conversation.composer.dock',
    id: 'ide-bridge',
    order: -10,
    locale: NS,
    inject: (): IdeBridgeBarInjected => ({ getContext }),
  }, IdeBridgeBar))
}

/**
 * Mount the generated ideBridge Remote, then register browser UI.
 * @param ctx - Client Cordis root.
 * @param contribution - generated Remote descriptors from the Host plugin package.
 * @returns disposer for Remote namespace and UI registrations.
 */
export async function mountIdeBridgeUi(
  ctx: ClientContext,
  contribution: TypertRemoteContribution,
): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(contribution)
  const ui = ctx.inject(['slots', 'locale', 'remote.ideBridge'], registerUi)
  try {
    await ui
  } catch (error) {
    await ui.dispose()
    await disposeRemote()
    throw error
  }
  return async () => {
    await ui.dispose()
    await disposeRemote()
  }
}
