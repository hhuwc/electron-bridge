import { contextBridge, ipcRenderer } from 'electron';

// Main 窗口的 preload 脚本
contextBridge.exposeInMainWorld('electronAPI', {
  // IPC通信
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, callback) => ipcRenderer.on(channel, callback),
    removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
  },
  
  // Main 窗口特有的API
  mainWindow: {
    minimize: () => ipcRenderer.invoke('main-window-minimize'),
    maximize: () => ipcRenderer.invoke('main-window-maximize'),
    close: () => ipcRenderer.invoke('main-window-close'),
  },
  
  // DevTools 控制
  devTools: {
    openWebviewDevTools: (webContentsId) => ipcRenderer.invoke('open-webview-devtools', webContentsId),
  },
  
  // 获取webview信息
  getWebContentsId: () => {
    return window.webContents?.id;
  }
});
