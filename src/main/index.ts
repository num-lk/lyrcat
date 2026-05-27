import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { execFile, spawn } from 'child_process'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // In-memory cache
  const cache = new Map<string, object>()

  ipcMain.handle('cache:get', async (_e, key: string) => cache.get(key))
  ipcMain.handle('cache:set', async (_e, key: string, value: object) => cache.set(key, value))

  // Helper methods
  const execStdout = async (file: string, args: string[]): Promise<string> =>
    new Promise((res, rej) => {
      execFile(file, args, (error, stdout) => {
        if (error) return rej(error.message || `${file} failed`)
        res(stdout.trim())
      })
    })
  const sendAllWindows = (channel: string, value: object | number | string | boolean): void =>
    BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(channel, value))
  const getStatusFormat = (...args: string[]): string =>
    args.map((key) => `{{ ${key} }}`).join('||')

  // Player controls
  ipcMain.on('playerctl:pause', () => execFile('playerctl', ['play-pause'], { timeout: 2000 }))
  ipcMain.on('playerctl:next', () => execFile('playerctl', ['next'], { timeout: 2000 }))
  ipcMain.on('playerctl:previous', () => execFile('playerctl', ['previous'], { timeout: 2000 }))
  ipcMain.on('playerctl:seek', (_e, position: number) => {
    // NOTE: Since the position following process tends to miss updates
    // triggered programatically, it is necessary to fire an IPC here
    sendAllWindows('playerctl:followposition', position)

    execFile('playerctl', ['position', position.toString()], { timeout: 2000 })
  })

  // Player info
  ipcMain.handle(
    'playerctl:status',
    async () => (await execStdout('playerctl', ['status'])) === 'Playing'
  )
  ipcMain.handle('playerctl:position', async () =>
    Number(await execStdout('playerctl', ['position']))
  )
  ipcMain.handle('playerctl:meta', async (_e, ...args: string[]) =>
    (await execStdout('playerctl', ['metadata', '--format', getStatusFormat(...args)])).split('||')
  )

  // Player events
  let playerctlUpdateProcess = spawn('playerctl', [
    'metadata',
    '-F',
    '--format',
    getStatusFormat('artist', 'title')
  ])

  playerctlUpdateProcess.stdout.on('data', (chunk) => {
    const line = String(chunk).trim()
    const [artist, title] = line.split('||')

    sendAllWindows('playerctl:followmeta', { artist, title })
  })

  let playerctlPositionProcess = spawn('playerctl', ['position', '-F'])

  playerctlPositionProcess.stdout.on('data', (chunk) => {
    const line = String(chunk).trim()
    const time = Number(line)

    sendAllWindows('playerctl:followposition', time)
  })

  let playerctlStatusProcess = spawn('playerctl', ['status', '-F'])

  playerctlStatusProcess.stdout.on('data', (chunk) => {
    const line = String(chunk).trim()
    const status = line === 'Playing'

    sendAllWindows('playerctl:followstatus', status)
  })

  playerctlUpdateProcess.on('exit', () => (playerctlUpdateProcess = null!))
  playerctlPositionProcess.on('exit', () => (playerctlPositionProcess = null!))
  playerctlStatusProcess.on('exit', () => (playerctlStatusProcess = null!))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
