import css from './IdeBridgeBar.module.css'

export interface IdeBridgeIconProps {
  ideId?: string | null
}

/** Official VS Code ribbon (Simple Icons path; monochrome). */
function VscodeIcon() {
  return (
    <svg
      className={css.icon}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"
      />
    </svg>
  )
}

/** Generic IDE window glyph for unknown hosts. */
function GenericIdeIcon() {
  return (
    <svg className={css.icon} viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-9ZM3.5 3a.5.5 0 0 0-.5.5V5h11V3.5a.5.5 0 0 0-.5-.5h-9ZM13 6H3v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V6ZM5 8.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 8.25Zm0 2.5a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"
      />
    </svg>
  )
}

/** IDE-branded icon when `ideId` is known; otherwise a generic IDE window. */
export function IdeBridgeIcon({ ideId }: IdeBridgeIconProps) {
  if (ideId === 'vscode') return <VscodeIcon />
  return <GenericIdeIcon />
}
