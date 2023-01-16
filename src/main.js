// Modules to control application life and create native browser window
const { app, shell, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { electronApp, optimizer } = require('@electron-toolkit/utils')
const { Mailer } = require('./mailer')

try {
  require('electron-reloader')(module)
} catch (_) {
  // ignore
}

let files = []
const mailer = new Mailer()

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux'
      ? {
          icon: path.join(__dirname, '../resources/icon.png')
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  })

  ipcMain.on('add-file', (event, p) => {
    console.log('add-file', p)
    if (files.filter((e) => e === p).length === 0) {
      files.push(p)
      mainWindow.webContents.send('update-files', files)
    }
  })

  ipcMain.on('remove-file', (event, p) => {
    console.log('remove-file', p)
    files = files.filter((e) => e !== p)
    mainWindow.webContents.send('update-files', files)
  })

  ipcMain.on('trigger-update-files', () => {
    console.log('trigger-update-files')
    mainWindow.webContents.send('update-files', files)
  })

  ipcMain.on('send', (event, subject, email) => {
    console.log('send', subject, email)
    mailer.send(subject, email, files)
  })

  mailer.on('before-send', (e) => {
    mainWindow.webContents.send('before-send', e)
    // console.log('before-send', e)
  })
  mailer.on('after-send', (e) => {
    mainWindow.webContents.send('after-send', e)
    // console.log('after-send', e)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'))
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

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
