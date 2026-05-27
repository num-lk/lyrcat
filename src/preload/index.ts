import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type SongMeta = {
  artist: string
  title: string
}

// Custom APIs for renderer
const api = {
  pausePlayer: () => ipcRenderer.send('playerctl:pause'),
  forwardPlayer: () => ipcRenderer.send('playerctl:next'),
  backPlayer: () => ipcRenderer.send('playerctl:previous'),
  seekPlayer: (position: number) => ipcRenderer.send('playerctl:seek', position * 0.001),
  playerStatus: () => ipcRenderer.invoke('playerctl:status'),
  playerPosition: async () => (await ipcRenderer.invoke('playerctl:position')) * 1000,
  playerMeta: (...args: string[]) =>
    ipcRenderer.invoke('playerctl:meta', ...(args.length ? args : ['artist', 'title'])),
  onPlayerUpdate: (callback: (meta: SongMeta) => void) => {
    const handler = (_e: IpcRendererEvent, meta: SongMeta): void => callback(meta)
    ipcRenderer.on('playerctl:followmeta', handler)
    return () => ipcRenderer.off('playerctl:followmeta', handler)
  },
  onPlayerPosition: (callback: (position: number) => void) => {
    const handler = (_e: IpcRendererEvent, position: number): void => callback(position * 1000)
    ipcRenderer.on('playerctl:followposition', handler)
    return () => ipcRenderer.off('playerctl:followposition', handler)
  },
  onPlayerStatus: (callback: (playing: boolean) => void) => {
    const handler = (_e: IpcRendererEvent, playing: boolean): void => callback(playing)
    ipcRenderer.on('playerctl:followstatus', handler)
    return () => ipcRenderer.off('playerctl:followstatus', handler)
  },
  removeListener: (channel: string, handler: () => void): void => {
    ipcRenderer.off(channel, handler)
  }
}

// Simple in-memory cache layer for renderer
const cache = {
  get: <T extends object = object>(key: string): Promise<T> => ipcRenderer.invoke('cache:get', key),
  set: (key: string, value: object) => ipcRenderer.invoke('cache:set', key, value)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('cache', cache)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.cache = cache
}
