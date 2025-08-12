<template>
  <div class="webview-container">
    <header class="webview-header">
      <div class="status" :class="statusClass">{{ status }}</div>
    </header>

    <div class="content">
      <div class="test-section">
        <h3>Bridge API 测试</h3>
        <div class="button-group">
          <button @click="testSyncCall" :disabled="loading" class="btn primary">
            测试同步调用
          </button>
          <button @click="testAsyncCall" :disabled="loading" class="btn secondary">
            测试异步调用
          </button>
          <button @click="clearResults" class="btn">
            清空结果
          </button>
        </div>
      </div>

      <div class="results-section">
        <h3>调用结果</h3>
        <div class="loading-indicator" v-if="loading">
          <div class="spinner"></div>
          <span>{{ loadingMessage }}</span>
        </div>
        <pre class="results" v-if="results">{{ results }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { syncBridgeCall, asyncBridgeCall } from '../../utils/bridge.js';

const status = ref('准备就绪');
const statusClass = ref('ready');
const loading = ref(false);
const loadingMessage = ref('');
const results = ref('');

// 测试同步调用
const testSyncCall = () => {
  loading.value = true;
  loadingMessage.value = '正在进行同步调用...（会阻塞线程）';
  status.value = '同步调用中';
  statusClass.value = 'loading';
  
  try {
    let result = '';
    
    // 测试1: 获取系统信息
    const sysInfo = syncBridgeCall('getSystemInfo', { detail: true });
    result += '系统信息:\n' + JSON.stringify(sysInfo, null, 2) + '\n\n';
    
    // 测试2: 执行加法计算
    const sumResult = syncBridgeCall('calculateSum', { a: 10, b: 20 });
    result += '计算结果:\n' + JSON.stringify(sumResult, null, 2) + '\n\n';
    
    // 测试3: 模拟耗时操作
    const slowResult = syncBridgeCall('slowOperation', { delay: 1000 });
    result += '耗时操作结果:\n' + JSON.stringify(slowResult, null, 2);
    
    results.value = result;
    status.value = '同步调用完成';
    statusClass.value = 'success';
  } catch (error) {
    results.value = '同步调用出错: ' + error.message;
    status.value = '调用失败';
    statusClass.value = 'error';
  } finally {
    loading.value = false;
  }
};

// 测试异步调用
const testAsyncCall = async () => {
  loading.value = true;
  loadingMessage.value = '正在进行异步调用...（不会阻塞线程）';
  status.value = '异步调用中';
  statusClass.value = 'loading';
  
  try {
    let result = '';
    
    // 测试1: 获取系统信息
    const sysInfo = await asyncBridgeCall('getSystemInfo', { detail: true });
    result += '系统信息:\n' + JSON.stringify(sysInfo, null, 2) + '\n\n';
    
    // 测试2: 执行加法计算
    const sumResult = await asyncBridgeCall('calculateSum', { a: 15, b: 25 });
    result += '计算结果:\n' + JSON.stringify(sumResult, null, 2) + '\n\n';
    
    // 测试3: 模拟耗时操作
    const slowResult = await asyncBridgeCall('slowOperation', { delay: 500 });
    result += '耗时操作结果:\n' + JSON.stringify(slowResult, null, 2);
    
    results.value = result;
    status.value = '异步调用完成';
    statusClass.value = 'success';
  } catch (error) {
    results.value = '异步调用出错: ' + error.message;
    status.value = '调用失败';
    statusClass.value = 'error';
  } finally {
    loading.value = false;
  }
};

// 清空结果
const clearResults = () => {
  results.value = '';
  status.value = '准备就绪';
  statusClass.value = 'ready';
};

onMounted(() => {
  console.log('WebView页面已挂载');
});
</script>

<style scoped>
.webview-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.webview-header {
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
}

.webview-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 300;
}

.status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status.ready {
  background: rgba(46, 204, 113, 0.2);
  border: 1px solid #2ecc71;
  color: #2ecc71;
}

.status.loading {
  background: rgba(241, 196, 15, 0.2);
  border: 1px solid #f1c40f;
  color: #f1c40f;
}

.status.success {
  background: rgba(46, 204, 113, 0.2);
  border: 1px solid #2ecc71;
  color: #2ecc71;
}

.status.error {
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid #e74c3c;
  color: #e74c3c;
}

.content {
  padding: 30px;
}

.test-section {
  margin-bottom: 30px;
}

.test-section h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 300;
}

.button-group {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn.primary {
  background: #3498db;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn.secondary {
  background: #9b59b6;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #8e44ad;
}

.btn:not(.primary):not(.secondary) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn:not(.primary):not(.secondary):hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.results-section h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 300;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.results {
  background: rgba(0, 0, 0, 0.3);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  backdrop-filter: blur(5px);
}

.results::-webkit-scrollbar {
  width: 8px;
}

.results::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.results::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.results::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
