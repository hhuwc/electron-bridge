import { contextBridge, ipcRenderer } from 'electron';

// MP Render 页面的 preload 脚本
contextBridge.exposeInMainWorld('electronAPI', {
  // IPC通信
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, callback) => ipcRenderer.on(channel, callback),
    removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
  },
  
  // 渲染相关的工具API (本地处理，不需要IPC)
  renderUtils: {
    getCanvasContext: () => {
      // 返回canvas上下文相关的工具
      return {
        create2D: (width, height) => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          return canvas.getContext('2d');
        }
      };
    },
    generateUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  },
  
  // Bridge API (如果需要与主进程通信)
  bridge: {
    // 这些方法已移至 utils/bridge.js 模块中
    // 在Vue组件中直接 import { syncBridgeCall, asyncBridgeCall } from '../../utils/bridge.js'
  },
  
  // 获取webview信息
  getWebContentsId: () => {
    return window.webContents?.id;
  }
});
