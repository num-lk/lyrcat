import {
  defaultSettigns,
  saveSettings,
  settingsContext,
  settingsMeta
} from '@renderer/common/Settings'
import { ReactElement, useContext, useEffect, useRef, useState } from 'react'
import styles from './menu.module.css'
import { useInputReducer } from '@renderer/hooks/navigation'
import { XIcon } from 'lucide-react'

export function SettingsMenu({ onClose }: { onClose: () => void }): ReactElement {
  const { settings, set } = useContext(settingsContext)
  const [remountBit, setRemountBit] = useState(false)

  // Track the current setting object trough a ref for use in cleanup
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  // Save settings when component is unmounted
  useEffect(() => () => saveSettings(settingsRef.current), [settingsRef])

  // Prevent other input handling while menu open
  useInputReducer<HTMLDivElement>({ Escape: onClose }, true, 'keydown')

  const onResetHandler = (): void => {
    set(defaultSettigns)
    setRemountBit((prevRemountBit) => !prevRemountBit)
  }

  return (
    <div className={styles.background}>
      <div className={styles.menu} role="menu" aria-modal aria-labelledby="settings-title">
        <button className={styles.close} onClick={onClose}>
          <XIcon />
        </button>
        <h2 id="settings-title">Settings</h2>
        {Object.entries(settings).map(([category, entries]) => (
          <>
            <h3 key={category}>{category}</h3>
            {Object.entries(entries).map(([setting, value]) => {
              const meta = settingsMeta[category][setting]
              const Field = meta.field
              const callback = (val: string): void =>
                set((prevSettings) => ({
                  ...prevSettings,
                  [category]: { ...prevSettings[category], [setting]: val }
                }))
              return (
                <div key={setting} className={styles.entry}>
                  <span>{`${settingsMeta[category][setting]?.name ?? setting}:`}</span>
                  <Field {...{ value, callback }} key={`${setting}${remountBit}`} />
                </div>
              )
            })}
          </>
        ))}
        <button className={styles.reset} onClick={onResetHandler}>
          Reset
        </button>
      </div>
    </div>
  )
}
