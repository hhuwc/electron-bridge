import { contextBridge, ipcRenderer } from 'electron';

// MP Service 页面的 preload 脚本
contextBridge.exposeInMainWorld('electronAPI', {
  // IPC通信
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, callback) => ipcRenderer.on(channel, callback),
    removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
  },
  
  // Bridge API (MP Service 的核心功能)
  bridge: {
    // 这些方法已移至 utils/bridge.js 模块中
    // 在Vue组件中直接 import { syncBridgeCall, asyncBridgeCall } from '../../utils/bridge.js'
  },
  
  // 获取webview信息
  getWebContentsId: () => {
    return window.webContents?.id;
  }
});
