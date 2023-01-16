// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  addFile: (p) => ipcRenderer.send('add-file', p),
  removeFile: (p) => ipcRenderer.send('remove-file', p),
  triggerUpdateFiles: (p) => ipcRenderer.send('trigger-update-files', p),
  send: (subject, email) => ipcRenderer.send('send', subject, email),
  updateFiles: (callback) => ipcRenderer.on('update-files', callback),
  beforeSend: (callback) => ipcRenderer.on('before-send', callback),
  afterSend: (callback) => ipcRenderer.on('after-send', callback)
})
