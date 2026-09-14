import { ColorField, RangeField } from '@renderer/components/settings/Fields'
import { createContext, Dispatch, InputHTMLAttributes, ReactElement, SetStateAction } from 'react'

export type Settings = {
  appearance: {
    background: string
    lyrics: string
  }
  lyrics: {
    offset: number
  }
}

export type SettingsField<T> = ({
  value,
  callback,
  ...rest
}: {
  value: T
  callback: (value: T) => void
} & InputHTMLAttributes<HTMLInputElement>) => ReactElement

type Metadata = {
  [K in keyof Settings]: {
    [S in keyof Settings[K]]?: {
      name?: string
      tooltip?: string
      field: SettingsField<Settings[K][S]>
    }
  }
}

const SETTINGS = 'settings' as const

export const settingsMeta: Metadata = {
  appearance: {
    background: {
      name: 'Background Color',
      tooltip: 'Accepts any valid CSS color value',
      field: ColorField
    },
    lyrics: {
      name: 'Lyric Color',
      tooltip: 'Accepts any valid CSS color value',
      field: ColorField
    }
  },
  lyrics: {
    offset: {
      name: 'Global Offset',
      tooltip: 'How far ahead lyrics are displayed in ms',
      field: (props) => <RangeField max={500} min={-500} {...props} />
    }
  }
} as const

export const defaultSettigns: Settings = {
  appearance: {
    background: '#1e1e2ef3',
    lyrics: '#fff'
  },
  lyrics: {
    offset: 200
  }
} as const

export function loadSettings(): Settings {
  const data = localStorage.getItem(SETTINGS)
  if (data == null) {
    localStorage.setItem(SETTINGS, JSON.stringify(defaultSettigns))
    return defaultSettigns
  } else {
    try {
      return JSON.parse(data) as Settings
    } catch {
      console.error('Malformed settings data, using defaults...')
      localStorage.setItem(SETTINGS, JSON.stringify(defaultSettigns))
      return defaultSettigns
    }
  }
}

export function saveSettings(data: Settings): void {
  localStorage.setItem(SETTINGS, JSON.stringify(data))
}

export const settingsContext = createContext<{
  settings: Settings
  set: Dispatch<SetStateAction<Settings>>
}>({
  settings: defaultSettigns,
  set: null!
})
