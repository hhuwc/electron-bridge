<template>
  <div class="main-container">
    <div class="workspace">
      <!-- 上侧：可新增的 MP Render 视图 -->
      <div class="mp-render-panel">
        <div class="panel-header">
          <h3>MP Render 视图 ({{ mpRenderViews.length }})</h3>
          <div class="panel-actions">
            <button @click="addMpRenderView" class="btn primary">
              ➕ 新增
            </button>
            <button 
              v-if="selectedMpRender" 
              @click="openMpRenderDevTools(selectedMpRender)" 
              class="btn debug-btn" 
              title="打开当前视图调试工具"
            >
              🔧 调试
            </button>
            <button 
              v-if="selectedMpRender" 
              @click="removeMpRenderViewById(selectedMpRender)" 
              class="btn danger"
              title="关闭当前视图"
            >
              关闭
            </button>
            <select v-model="selectedMpRender" @change="switchMpRender" class="render-selector">
              <option value="">选择视图</option>
              <option v-for="view in mpRenderViews" :key="view.id" :value="view.id">
                {{ view.name }}
              </option>
            </select>
            <div class="panel-status">
              <span class="status-dot" :class="{ active: mpRenderViews.length > 0 }"></span>
              {{ mpRenderViews.length > 0 ? '运行中' : '已停止' }}
            </div>
          </div>
        </div>

        <div class="render-container">
          <div v-for="view in mpRenderViews" :key="view.id" 
               :class="['render-wrapper', { active: view.id === selectedMpRender }]">
            <webview
              :src="view.src"
              :id="view.id"
              class="webview"
              webpreferences="webSecurity: false; contextIsolation: false"
              nodeintegration="true"
              @did-finish-load="onMpRenderLoad"
            ></webview>
          </div>

          <div v-if="mpRenderViews.length === 0" class="empty-render-state">
            <div class="welcome-render">
              <h4>暂无 MP Render 视图</h4>
              <p>点击"添加新的 MP Render 视图"开始</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 下侧：固定的 MP Service -->
      <div class="mp-service-panel">
        <div class="panel-header">
          <h3>MP Service (固定)</h3>
          <div class="panel-actions">
            <button @click="openMpServiceDevTools" class="btn debug-btn" title="打开调试工具">
              🔧 调试
            </button>
            <div class="panel-status">
              <span class="status-dot active"></span>
              运行中
            </div>
          </div>
        </div>
        <webview
          :src="mpServiceSrc"
          id="mp-service-webview"
          class="webview"
          webpreferences="webSecurity: false; contextIsolation: false"
          nodeintegration="true"
          @did-finish-load="onMpServiceLoad"
        ></webview>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

// MP Render 视图管理
const mpRenderViews = ref([]);
const selectedMpRender = ref('');
let mpRenderCounter = 0;

// webview 的 webContentsId 映射
const webviewIds = ref({
  mpService: null,
  mpRender: {}
});

// MP Service 数据
const mpServiceSrc = computed(() => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3120/src/renderer/mp-service/'
    : '../renderer/mp-service.html';
});

// 添加新的 MP Render 视图
const addMpRenderView = () => {
  mpRenderCounter++;
  const newView = {
    id: `mp-render-${mpRenderCounter}`,
    name: `MP Render ${mpRenderCounter}`,
    src: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3120/src/renderer/mp-render/'
      : '../renderer/mp-render.html'
  };
  
  mpRenderViews.value.push(newView);
  selectedMpRender.value = newView.id;
};

// 根据ID移除指定的 MP Render 视图
const removeMpRenderViewById = (id) => {
  const index = mpRenderViews.value.findIndex(v => v.id === id);
  if (index > -1) {
    mpRenderViews.value.splice(index, 1);
    
    // 清理对应的 webContentsId
    const viewId = id.replace('mp-render-', '');
    delete webviewIds.value.mpRender[viewId];
    
    if (selectedMpRender.value === id) {
      selectedMpRender.value = mpRenderViews.value.length > 0 ? mpRenderViews.value[0].id : '';
    }
  }
};

// 切换 MP Render 视图
const switchMpRender = () => {
  console.log('切换到 MP Render 视图:', selectedMpRender.value);
};

// 打开 MP Service DevTools
const openMpServiceDevTools = async () => {
  const webContentsId = webviewIds.value.mpService;
  if (webContentsId && window.electronAPI) {
    try {
      const result = await window.electronAPI.devTools.openWebviewDevTools(webContentsId);
      if (result.success) {
        console.log('MP Service DevTools 已打开');
      } else {
        console.error('打开 MP Service DevTools 失败:', result.error);
      }
    } catch (error) {
      console.error('调用打开 MP Service DevTools 失败:', error);
    }
  } else {
    console.warn('MP Service webview 尚未加载完成');
  }
};

// 打开指定 MP Render DevTools
const openMpRenderDevTools = async (fullViewId) => {
  // 从完整 ID 中提取数字部分，例如 'mp-render-1' -> '1'
  const viewId = fullViewId.replace('mp-render-', '');
  
  console.log('=== 尝试打开 MP Render DevTools ===');
  console.log('完整 viewId:', fullViewId);
  console.log('提取的 viewId:', viewId);
  console.log('当前 webviewIds.value.mpRender:', webviewIds.value.mpRender);
  
  let webContentsId = webviewIds.value.mpRender[viewId];
  
  // 如果没有找到，尝试等待一下再查找
  if (!webContentsId) {
    console.log('第一次查找失败，等待 500ms 后重试...');
    await new Promise(resolve => setTimeout(resolve, 500));
    webContentsId = webviewIds.value.mpRender[viewId];
  }
  
  if (webContentsId && window.electronAPI) {
    try {
      const result = await window.electronAPI.devTools.openWebviewDevTools(webContentsId);
      if (result.success) {
        console.log(`MP Render ${viewId} DevTools 已打开`);
      } else {
        console.error(`打开 MP Render ${viewId} DevTools 失败:`, result.error);
      }
    } catch (error) {
      console.error(`调用打开 MP Render ${viewId} DevTools 失败:`, error);
    }
  } else {
    console.warn(`MP Render ${viewId} webview 尚未加载完成，webContentsId:`, webContentsId);
    console.log('当前所有 webviewIds:', webviewIds.value);
  }
};

// MP Service webview 加载完成回调
const onMpServiceLoad = (event) => {
  const webview = event.target;
  const webContentsId = webview.getWebContentsId();
  console.log('MP Service webview 加载完成，webContentsId:', webContentsId);
  
  // 保存 webContentsId
  webviewIds.value.mpService = webContentsId;
  
  // 通知主进程webview已加载
  if (window.electronAPI) {
    window.electronAPI.ipcRenderer.send('webview-loaded', webContentsId);
  }
};

// MP Render webview 加载完成回调
const onMpRenderLoad = (event) => {
  const webview = event.target;
  const webContentsId = webview.getWebContentsId();
  const viewId = webview.id.replace('mp-render-', '');
  
  console.log('=== MP Render webview 加载完成 ===');
  console.log('webview:', webview);
  console.log('webview.id:', webview.id);
  console.log('webContentsId:', webContentsId);
  console.log('提取的 viewId:', viewId);
  console.log('准备存储到 webviewIds.value.mpRender[' + viewId + ']');
  
  // 保存 webContentsId
  webviewIds.value.mpRender[viewId] = webContentsId;
  
  console.log('存储后的 webviewIds.value.mpRender:', webviewIds.value.mpRender);
  
  // 通知主进程webview已加载
  if (window.electronAPI) {
    window.electronAPI.ipcRenderer.send('webview-loaded', webContentsId);
  }
};

// 组件挂载时的初始化
onMounted(() => {
  console.log('主窗口已加载');
  // 默认添加一个 MP Render 视图
  addMpRenderView();
});
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.4;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.primary {
  background: #3498db;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn.danger {
  background: #e74c3c;
  color: white;
}

.btn.danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn.debug-btn {
  background: #f39c12;
  color: white;
  border: 1px solid #e67e22;
}

.btn.debug-btn:hover:not(:disabled) {
  background: #e67e22;
}

.workspace {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

/* MP Render 面板 (上部分，60%高度) */
.mp-render-panel {
  flex: 0.5;
  display: flex;
  flex-direction: column;
}

/* MP Service 面板 (下部分，40%高度) */
.mp-service-panel {
  flex: 0.5;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: #34495e;
  color: white;
  min-height: 50px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.panel-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #95a5a6;
}

.status-dot.active {
  background: #2ecc71;
}

.render-selector {
  padding: 6px 12px;
  border: 1px solid #7f8c8d;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
  background: white;
  color: #2c3e50;
  height: 34px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
}

.render-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.render-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.render-wrapper.active {
  opacity: 1;
  pointer-events: auto;
}

.webview {
  flex: 1;
  border: none;
  background: white;
}

.empty-render-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #ecf0f1;
}

.welcome-render {
  text-align: center;
  color: #7f8c8d;
}

.welcome-render h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 16px;
}

.welcome-render p {
  margin: 0;
  font-size: 14px;
}
</style>
