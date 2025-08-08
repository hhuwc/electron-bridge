// main.js - Electron主进程
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { session, webContents } = require("electron");

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // 启用webview标签
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 加载宿主页面
  mainWindow.loadFile("index.html");

  // 打开开发者工具
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.on("webview-loaded", (event, webContentsId) => {
  console.log("webview-loaded:", webContentsId);

  try {
    const targetWebContents = webContents.fromId(webContentsId);
    targetWebContents.openDevTools();

    // 仅拦截该 webview 的请求
    targetWebContents.session.webRequest.onBeforeRequest(
      { urls: ["http://localhost:8080/sync-bridge"] },
      (details, callback) => {
        console.log("webview request:", details.url);

        // 解析请求体数据
        let body = "";
        if (details.uploadData && details.uploadData.length > 0) {
          body = details.uploadData[0].bytes.toString();
        }

        try {
          const { method, params } = JSON.parse(body);
          console.log("webview request params:", method, params);

          const res = handle({ method, params });
          console.log("get result:", res);

          // 1. 生成临时文件路径（存放在系统临时目录）
          const tempDir = os.tmpdir();
          const fileName = `${details.id}.json`; // 唯一文件名，避免冲突
          const tempPath = path.join(tempDir, fileName);
          console.log("tempPath:", tempPath);

          // 2. 将响应结果写入临时文件
          fs.writeFileSync(tempPath, JSON.stringify(res), "utf8");

          // 3. 重定向到本地文件（file:协议，避免跨协议安全限制）
          callback({  
            // cancel: true,
            // redirectURL: `https://www.baidu.com` 
            redirectURL: `file://${tempPath}` 
          });

          //   callback({
          //     cancel: true,
          //   });

          //   callback({
          //     redirectURL: `data:application/json,${encodeURIComponent(JSON.stringify(res))}`
          //   })

          //   // 保存回调，等待主进程处理后执行
          //   pendingCallbacks.set(details.id, callback);

          //   // 转发请求到主进程处理
          //   ipcRenderer.send("sync-bridge-request", {
          //     requestId: details.id,
          //     method,
          //     params,
          //   });
        } catch (error) {
          console.error("解析请求失败:", error);
          callback({ cancel: true }); // 解析失败则取消请求
        }
      }
    );
  } catch (error) {
    console.log("webview-loaded error:", error);
  }
});

// 监听同步桥接请求
function handle({ method, params }) {
  try {
    let result;

    // 根据不同方法处理请求
    switch (method) {
      case "getSystemInfo":
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

      case "calculateSum":
        if (typeof params.a !== "number" || typeof params.b !== "number") {
          throw new Error("参数必须为数字");
        }
        result = {
          a: params.a,
          b: params.b,
          sum: params.a + params.b,
          message: "计算完成",
        };
        break;

      case "slowOperation":
        // 模拟耗时操作（会阻塞主进程，仅作演示）
        const delay = Math.min(Math.max(params.delay || 100, 100), 3000); // 限制在100-3000ms
        const start = Date.now();
        while (Date.now() - start < delay) {
          // 空循环阻塞
        }
        result = {
          delay,
          actualDelay: Date.now() - start,
          message: "耗时操作完成",
        };
        break;

      default:
        throw new Error(`未知方法: ${method}`);
    }
    return {
      data: result,
      msg: "ok",
      code: 0,
    };
  } catch (error) {
    return {
      msg: error.message,
      code: 1,
    };
  }
}

// 应用就绪后创建窗口
app.whenReady().then(createWindow);

// 关闭所有窗口时退出应用
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
