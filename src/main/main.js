import { app, BrowserWindow, ipcMain, protocol, webContents } from 'electron';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';

// 在打包后的环境中，使用相对路径
const isDev = process.env.NODE_ENV === 'development';
const __dirname = isDev ? process.cwd() : dirname(process.execPath);

// 注册自定义协议
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'mp-bridge',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true,
      bypassCSP: true
    }
  }
]);

let mainWindow;

function createWindow() {
  const mainPreloadPath = isDev 
    ? join(__dirname, 'dist', 'preload', 'main.cjs')
    : join(__dirname, '..', 'preload', 'main.cjs');
    
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: mainPreloadPath,
    },
  });

  // 开发环境使用vite dev server，生产环境使用构建后的文件
  if (isDev) {
    mainWindow.loadURL('http://localhost:3120/src/renderer/main/');
  } else {
    mainWindow.loadFile(join(__dirname, '..', 'renderer', 'main.html'));
  }

  // 开发环境打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 处理自定义协议
app.whenReady().then(() => {
  protocol.handle('mp-bridge', async (request) => {
    const url = request.url.replace(/\/$/, '');
    if (url !== 'mp-bridge://sync') {
      return new Response('Not Found', { status: 404 });
    }

    console.log('mp-bridge request:', request.url, request.method);

    try {
      let requestBody = '';
      if (request.method === 'POST' && request.body) {
        const reader = request.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          requestBody += decoder.decode(value, { stream: true });
        }
      }

      const { method, params } = JSON.parse(requestBody);
      console.log('处理方法:', method, '参数:', params);

      const result = handleBridgeCall({ method, params });
      
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }));
        }, 1000);
      });
    } catch (error) {
      console.error('Protocol handler error:', error);
      return new Response(JSON.stringify({
        code: 1,
        msg: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  });

  createWindow();
});

// IPC 处理程序
ipcMain.handle('main-window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('main-window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('main-window-close', () => {
  if (mainWindow) mainWindow.close();
});

// 打开指定 webview 的 DevTools
ipcMain.handle('open-webview-devtools', (event, webContentsId) => {
  try {
    const targetWebContents = webContents.fromId(webContentsId);
    if (targetWebContents) {
      targetWebContents.openDevTools();
      return { success: true };
    } else {
      return { success: false, error: 'WebContents not found' };
    }
  } catch (error) {
    console.error('打开 webview DevTools 失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理webview加载完成事件
ipcMain.on('webview-loaded', (event, webContentsId) => {
  console.log('webview-loaded:', webContentsId);

  try {
    const targetWebContents = webContents.fromId(webContentsId);
    // 移除自动打开 DevTools，改为按需打开
  } catch (error) {
    console.log('webview-loaded error:', error);
  }
});

// 桥接方法处理器
function handleBridgeCall({ method, params }) {
  try {
    let result;

    switch (method) {
      case 'getSystemInfo':
        result = {
          platform: process.platform,
          electronVersion: process.versions.electron,
          nodeVersion: process.versions.node,
          timestamp: new Date().toISOString(),
          detail: params.detail
            ? {
                arch: process.arch,
                release: process.release.name,
              }
            : undefined,
        };
        break;

      case 'calculateSum':
        if (typeof params.a !== 'number' || typeof params.b !== 'number') {
          throw new Error('参数必须为数字');
        }
        result = {
          a: params.a,
          b: params.b,
          sum: params.a + params.b,
          message: '计算完成',
        };
        break;

      case 'slowOperation':
        const delay = Math.min(Math.max(params.delay || 100, 100), 3000);
        const start = Date.now();
        while (Date.now() - start < delay) {
          // 空循环阻塞
        }
        result = {
          delay,
          actualDelay: Date.now() - start,
          message: '耗时操作完成',
        };
        break;

      default:
        throw new Error(`未知方法: ${method}`);
    }

    return {
      data: result,
      msg: 'ok',
      code: 0,
    };
  } catch (error) {
    return {
      msg: error.message,
      code: 1,
    };
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
