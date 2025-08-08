// preload.js - 预加载脚本
const { contextBridge, ipcRenderer } = require('electron');

// 按需暴露API（本示例中宿主页面不需要额外API）
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: ipcRenderer.send.bind(ipcRenderer),
        on: ipcRenderer.on.bind(ipcRenderer),
    }
});
