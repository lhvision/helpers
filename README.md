<div align="center">

[![Ameth](https://raw.githubusercontent.com/lhvision/lhvision/main/images/Ameth.png)](https://github.com/lhvision/vscode-settings)

# @lhvision/helpers

_✨ 一些简单实用的工具函数封装 ✨_

</div>

# Install

```bash
pnpm add @lhvision/helpers
```

**IMPORTANT:** 从 2.0 开始移除了 CJS 产物只支持 ESM

# helpers

默认导出为 `browser.js` `shared.js` 所有函数

```ts
import { } from '@lhvision/helpers'
import { } from '@lhvision/helpers/browser'
import { } from '@lhvision/helpers/shared'
import { } from '@lhvision/helpers/upload'
```

## browser.js

工具函数集合，用于浏览器环境。

### 视觉/媒体

- `AudioVisualizer` - 音频可视化工具
- `CenterTextRenderer` - 居中文本渲染器
- `getEyeDropperColor` - 获取屏幕取色器颜色

### 全屏操作

- `exitFullScreen` - 退出全屏
- `getFullScreenElement` - 获取全屏元素
- `isFullScreen` - 判断是否全屏
- `requestFullScreen` - 请求全屏
- `toggleFullScreen` - 切换全屏状态
- `onFullScreenChange` - 监听全屏变化
- `offFullScreenChange` - 移除全屏监听

### 剪贴板

- `copyText` - 复制文本
- `readText` - 读取剪贴板文本
- `pasteImage` - 粘贴图片

### 下载

- `downloadBlob` - 下载 Blob 数据
- `downloadUrl` - 下载 URL
- `downloadWithProgress` - 带进度的下载
- `streamDownload` - 流式下载

### 其他

- `watchVisibility` - 监听页面可见性
- `getTokenPayload` - 获取 Token 载荷
- `isTokenExpiringSoon` - 检查 Token 是否即将过期
- `hexToRgb` - 十六进制转 RGB
- `rgbToHsl` - RGB 转 HSL
- `rgbToHsv` - RGB 转 HSV

## shared.js

通用工具函数。

### 缓存

- `AsyncLRUCache` - 异步 LRU 缓存
- `LRUCache` - LRU 缓存

### 请求处理

- `RequestManager` - 请求管理器
- `request` - 请求函数

### 流处理

- `processBinaryStream` - 二进制流处理
- `processByte` - 字节处理
- `processTextStream` - 文本流处理

### 工具函数

- `debounce` - 防抖
- `throttle` - 节流
- `pLimit` - 并发限制

## upload.js

文件上传相关功能。

### 哈希计算

- `initHashWASM` - 初始化 WASM
- `calculateMD5` - 计算 MD5
- `calculateStreamMD5` - 流式计算大文件 MD5
- `calculateMD5WithWorker` - Worker 方式计算 MD5
- `calculateLargeFileMD5` - 智能选择方式计算大文件 MD5

### 分片处理

- `calculateChunksMD5` - 计算文件分片 MD5
- `calculateChunksMD5WithWorkers` - Worker 并行计算分片 MD5

### 上传流程

- `createFileHashStream` - 创建文件哈希计算流
- `hashStreamToUploadStream` - 哈希流转上传流
- `uploadFileInChunks` - 通用分片上传流程
