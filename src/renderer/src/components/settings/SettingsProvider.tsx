import { settingsContext, loadSettings } from '@renderer/common/Settings'
import { color } from 'motion'
import { ReactElement, ReactNode, useMemo, useState } from 'react'

export function SettingsProvider({ children }: { children: ReactNode }): ReactElement {
  const [settings, setSettings] = useState(() => loadSettings())

  // Update CSS variables
  const root = document.querySelector<HTMLElement>(':root')
  if (root) {
    root.style.setProperty('--color-background', settings.appearance.background)
    root.style.setProperty('--color-lyrics', settings.appearance.lyrics)

    const shadowColor = color.parse(settings.appearance.lyrics)
    shadowColor.alpha *= 0.5
    root.style.setProperty('--color-lyrics-shadow', color.transform(shadowColor))
  }

  // Create memoized object
  const context = useMemo(() => ({ settings, set: setSettings }), [settings])

  return <settingsContext.Provider value={context}>{children}</settingsContext.Provider>
}
