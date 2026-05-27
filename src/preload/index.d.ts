import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      pausePlayer: () => void
      seekPlayer: (position: number) => void
      forwardPlayer: () => void
      backPlayer: () => void
      playerStatus: () => Promise<boolean>
      playerPosition: () => Promise<number>
      playerMeta: (...args: string[]) => Promise<string[]>
      onPlayerStatus: (callback: (playing: boolean) => void) => () => void
      onPlayerPosition: (callback: (pos: number) => void) => () => void
      onPlayerUpdate: (callback: (meta: { artist: string; title: string }) => void) => () => void
    }
    cache: {
      get: <T = object>(key: string) => Promise<T | null>
      set: (key: string, value: object | array) => Promise<void>
    }
  }
}
