// 桥接通信工具模块
// 提供同步和异步的桥接调用方法

/**
 * 同步桥接调用
 * @param {string} method - 调用的方法名
 * @param {Object} params - 参数对象
 * @returns {Object} - 调用结果
 */
export const syncBridgeCall = (method, params) => {
  console.log(`开始同步调用: ${method}`);
  const startTime = Date.now();
  
  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'mp-bridge://sync', false); // 同步请求
  xhr.setRequestHeader('Content-Type', 'application/json');
  
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      console.log('XHR状态:', xhr.status, xhr.statusText);
      console.log('响应头:', xhr.getAllResponseHeaders());
    }
  };
  
  try {
    xhr.send(JSON.stringify({ method, params }));
    
    const endTime = Date.now();
    console.log(`同步调用完成，耗时: ${endTime - startTime}ms`);
    console.log('响应状态:', xhr.status);
    console.log('响应文本:', xhr.responseText);
    
    if (xhr.status === 200) {
      return JSON.parse(xhr.responseText);
    } else {
      throw new Error(`请求失败: ${xhr.status} ${xhr.statusText}`);
    }
  } catch (error) {
    console.error('同步调用出错:', error);
    throw error;
  }
};

/**
 * 异步桥接调用
 * @param {string} method - 调用的方法名
 * @param {Object} params - 参数对象
 * @returns {Promise<Object>} - 返回Promise包装的调用结果
 */
export const asyncBridgeCall = (method, params) => {
  console.log(`开始异步调用: ${method}`);
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'mp-bridge://sync', true); // 异步请求
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        const endTime = Date.now();
        console.log(`异步调用完成，耗时: ${endTime - startTime}ms`);
        console.log('XHR状态:', xhr.status, xhr.statusText);
        console.log('响应文本:', xhr.responseText);
        
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (error) {
            reject(new Error('解析响应失败: ' + error.message));
          }
        } else {
          reject(new Error(`请求失败: ${xhr.status} ${xhr.statusText}`));
        }
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('网络错误'));
    };
    
    try {
      xhr.send(JSON.stringify({ method, params }));
    } catch (error) {
      console.error('异步调用出错:', error);
      reject(error);
    }
  });
};
