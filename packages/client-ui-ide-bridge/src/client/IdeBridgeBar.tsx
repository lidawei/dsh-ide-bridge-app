import { useEffect, useState } from 'react'

import type { IdeBridgeContext } from '@deepseek-ai/dsh-ide-bridge/types'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'

import { editorLocationTooltip, formatIdeBridgeLine } from './format.ts'
import { IdeBridgeIcon } from './IdeBridgeIcon.tsx'
import type { IdeBridgeBarInjected } from './mount.ts'
import css from './IdeBridgeBar.module.css'

export type IdeBridgeBarProps = IdeBridgeBarInjected & PropsLocale<'ideBridge'>

export function IdeBridgeBar({ getContext, t }: IdeBridgeBarProps) {
  const [context, setContext] = useState<IdeBridgeContext | null>(null)

  useEffect(() => {
    let alive = true
    const tick = async (): Promise<void> => {
      const next = await getContext()
      if (alive) setContext(next)
    }
    void tick()
    const timer = setInterval(() => { void tick() }, 1_000)
    return () => { alive = false; clearInterval(timer) }
  }, [getContext])

  const connected = context?.connected === true
  const line = connected && context !== null
    ? formatIdeBridgeLine(context)
    : (context?.error ?? t('status.disconnected'))
  const tooltip = context?.error
    ?? (connected && context?.editor ? editorLocationTooltip(context.editor) : undefined)

  return (
    <div
      className={css.root}
      title={tooltip}
      aria-label={line}
    >
      <IdeBridgeIcon ideId={context?.ideId} />
      <span className={css.line}>{line}</span>
    </div>
  )
}
