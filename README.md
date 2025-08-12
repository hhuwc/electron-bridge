# Electron 小程序双线程架构模拟器

## 项目简介

本项目是一个使用 Electron + Vue 3 构建的小程序双线程架构模拟器，用于演示和研究小程序的渲染层（View）和逻辑层（Service）的分离架构模式。

## 小程序双线程架构概述

小程序采用双线程架构设计，主要分为：

- **渲染层（View）**：负责界面渲染，运行在 WebView 中
- **逻辑层（Service）**：负责业务逻辑处理，运行在 JSCore 中
- **Native 层**：作为桥接层，负责两个线程之间的通信

## 项目架构

```
src/
├── main/                    # Electron 主进程
│   └── main.js             # 主进程入口，桥接协议处理
├── renderer/               # 渲染进程
│   ├── main/               # 主窗口（管理界面）
│   │   ├── App.vue         # 主窗口组件
│   │   ├── index.html      # 主窗口模板
│   │   └── preload.js      # 主窗口预加载脚本
│   ├── mp-render/          # 小程序渲染层模拟
│   │   ├── App.vue         # 渲染层测试界面
│   │   ├── index.html      # 渲染层模板
│   │   └── preload.js      # 渲染层预加载脚本
│   └── mp-service/         # 小程序逻辑层模拟
│       ├── App.vue         # 逻辑层测试界面
│       ├── index.html      # 逻辑层模板
│       └── preload.js      # 逻辑层预加载脚本
├── utils/                  # 公共工具
│   └── bridge.js           # 桥接通信工具
└── styles/                 # 全局样式
```

## 核心功能

### 1. 双线程隔离

- **MP Render（渲染层）**：模拟小程序的视图层，负责 UI 渲染和用户交互
- **MP Service（逻辑层）**：模拟小程序的逻辑层，负责数据处理和业务逻辑

### 2. 桥接通信

通过自定义协议 `mp-bridge://sync` 实现渲染层和逻辑层的通信：

- **同步调用**：使用 XMLHttpRequest 同步模式，会阻塞当前线程
- **异步调用**：使用 XMLHttpRequest 异步模式 + Promise，不阻塞线程

### 3. DevTools 支持

- 独立的开发者工具控制
- 可以分别打开 MP Render 和 MP Service 的 DevTools
- 便于调试和性能分析

## 技术栈

- **Electron**: 32.0.x - 跨平台桌面应用框架
- **Vue 3**: 3.5.x - 渐进式前端框架
- **Vite**: 5.4.x - 现代化构建工具
- **ES Modules**: 现代 JavaScript 模块系统

## 快速开始

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 开发模式

\`\`\`bash
npm run dev
\`\`\`

### 构建应用

\`\`\`bash
npm run build
\`\`\`

### 打包应用

\`\`\`bash
npm run dist
\`\`\`

## 使用说明

### 1. 启动应用

运行 \`npm run dev\` 后，会打开主管理窗口，显示垂直分割的布局：

- **上半部分**：MP Render WebView（小程序渲染层）
- **下半部分**：MP Service WebView（小程序逻辑层）

### 2. 测试桥接通信

在每个 WebView 中都有测试按钮：

- **测试同步调用**：演示同步通信模式（会阻塞线程）
- **测试异步调用**：演示异步通信模式（不阻塞线程）
- **清空结果**：清除测试结果

### 3. 开发调试

点击每个 WebView 右上角的 "DevTools" 按钮可以打开对应的开发者工具进行调试。

## 桥接通信 API

项目提供了统一的桥接通信工具 \`src/utils/bridge.js\`：

\`\`\`javascript
import { syncBridgeCall, asyncBridgeCall } from '../utils/bridge.js';

// 同步调用示例
const result = syncBridgeCall('getSystemInfo', { detail: true });

// 异步调用示例
asyncBridgeCall('calculateSum', { a: 10, b: 20 })
  .then(result => console.log(result))
  .catch(error => console.error(error));
\`\`\`

### 支持的测试方法

- \`getSystemInfo\`: 获取系统信息
- \`calculateSum\`: 计算两数之和
- \`slowOperation\`: 模拟耗时操作

## 项目特点

### 1. 真实架构模拟

- 完全模拟小程序的双线程架构
- 渲染层和逻辑层完全隔离
- 通过桥接协议进行通信

### 2. 开发友好

- 热重载支持
- 独立的 DevTools
- 完整的错误处理和日志

### 3. 可扩展性

- 模块化设计
- 统一的桥接工具
- 易于添加新的通信方法

## 学习价值

这个项目对于理解小程序架构具有重要的学习价值：

1. **架构理解**：深入理解双线程架构的设计思路
2. **通信机制**：掌握跨线程通信的实现方法
3. **性能考量**：体验同步和异步调用的性能差异
4. **调试技巧**：学习如何调试双线程应用

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 许可证

MIT License
