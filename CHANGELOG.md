## [2.0.8](https://github.com/lhvision/helpers/compare/v2.0.7...v2.0.8) (2024-11-16)


### Features

* 移除产物不必要的 class jsdoc，打包配置 target 调整为 esnext，新增 binarySearch 相关函数 ([c72d51d](https://github.com/lhvision/helpers/commit/c72d51d00307c7f867a1ec4128bef809927c152e))


### BREAKING CHANGES

* 打包配置 target 调整为 esnext



## [2.0.7](https://github.com/lhvision/helpers/compare/v2.0.6...v2.0.7) (2024-11-13)


### Features

* 新增 clipboard 相关函数 pasteImage、copyText、readText，监听页面可见性函数 watchVisibility ([cad5072](https://github.com/lhvision/helpers/commit/cad50725f7e595dac979609da0f857b62b31e7b2))



## [2.0.6](https://github.com/lhvision/helpers/compare/v2.0.5...v2.0.6) (2024-11-12)


### Features

* 因为 RequestManager 为单例，调整 request 为单独导出 ([f3323d5](https://github.com/lhvision/helpers/commit/f3323d5c4382914de8e1e16da96b38e9a770c5cc))



## [2.0.5](https://github.com/lhvision/helpers/compare/v2.0.4...v2.0.5) (2024-11-10)


### Features

* 优化 audioVisualizer, 新增防抖节流函数 ([646e11c](https://github.com/lhvision/helpers/commit/646e11c56ab4412e85aa5c95cedd59ccfb85f3bc))



## [2.0.4](https://github.com/lhvision/helpers/compare/v2.0.3...v2.0.4) (2024-11-07)


### Features

* 新增 getEyeDropperColor 函数，优化 audio 生成频谱图类 ([ab387b7](https://github.com/lhvision/helpers/commit/ab387b79c28ad05191860763889b45d56760f632))



## [2.0.3](https://github.com/lhvision/helpers/compare/v2.0.2...v2.0.3) (2024-11-06)


### Features

* request 新增直接返回 Response 对象参数 rawResponse 以用于流式下载等场景 ([f778ac2](https://github.com/lhvision/helpers/commit/f778ac2bd62f0c89a1bbade5ecff91e37d712fe3))



## [2.0.2](https://github.com/lhvision/helpers/compare/v2.0.1...v2.0.2) (2024-11-06)


### Bug Fixes

* 修复 build 后不该保留的代码注释 ([fc92004](https://github.com/lhvision/helpers/commit/fc920043af9e92eb2f2a742fa64fc6318a1f6fa0))



## [2.0.1](https://github.com/lhvision/helpers/compare/v2.0.0...v2.0.1) (2024-11-06)


### Features

* 调整 request 拦截器现在可以为不同的域名注册拦截器或者默认的拦截器，新增 audio 频谱图生成函数 ([0aa8337](https://github.com/lhvision/helpers/commit/0aa8337f2f4b52b57a7022f294847bc22cca18f3))



# [2.0.0](https://github.com/lhvision/helpers/compare/v1.0.7...v2.0.0) (2024-11-05)


### Features

* 新增 request、download、uploadFileInChunks、stream 相关函数 ([1df1d7a](https://github.com/lhvision/helpers/commit/1df1d7a4a0c29a18d5af0179e6cda1272ba0a7c5))


### BREAKING CHANGES

* 从 2.0 开始移除了 CJS 产物只支持 ESM



## [1.0.7](https://github.com/lhvision/helpers/compare/v1.0.6...v1.0.7) (2024-10-30)


### Features

* 调整 upload 作为独立的模块 ([2218cbb](https://github.com/lhvision/helpers/commit/2218cbb69d55eaa3abf3cae470fa77daf255e153))



## [1.0.6](https://github.com/lhvision/helpers/compare/v1.0.5...v1.0.6) (2024-10-29)


### Bug Fixes

* 调整 largeFileHashWithWorkers 实现，新增默认命令创建一个 worker/hashWorker.ts 文件 ([e466d99](https://github.com/lhvision/helpers/commit/e466d998d13adeb2e2f52e09b573662d9190703b))



## [1.0.5](https://github.com/lhvision/helpers/compare/v1.0.4...v1.0.5) (2024-10-29)


### Bug Fixes

* 删除 byte.ts 中的意外导出，调整 upload 中的 worker 引入为内联 ([ee37eb2](https://github.com/lhvision/helpers/commit/ee37eb2172dcfd21bc8db4fe682819f39293c53e))



## [1.0.4](https://github.com/lhvision/helpers/compare/v1.0.3...v1.0.4) (2024-10-29)


### Features

* 新增 md5-hash、upload、图片转 base64 相关函数 ([9fcf872](https://github.com/lhvision/helpers/commit/9fcf8726ba5e5db505a2518074ec5b04eca3c50e))



## [1.0.3](https://github.com/lhvision/helpers/compare/v1.0.2...v1.0.3) (2024-10-16)


### Features

* 新增 LRUCache，AsyncLRUCache 类实现 ([711ca0a](https://github.com/lhvision/helpers/commit/711ca0a0a2251e80043bfcbbeae6b2c593345f48))



## [1.0.2](https://github.com/lhvision/helpers/compare/21fb32823945fa2616604337c5ab269da7f43663...v1.0.2) (2024-10-16)


### Features

* 测试 ci 脚本 ([1cebd65](https://github.com/lhvision/helpers/commit/1cebd655334342e1747e7a1f9f7a818cff68e0b2))
* 同步上一个发布的版本内容 ([21fb328](https://github.com/lhvision/helpers/commit/21fb32823945fa2616604337c5ab269da7f43663))
* 新增 fullScreen 操作相关函数 ([ab7f6d5](https://github.com/lhvision/helpers/commit/ab7f6d5b2500769fb1d2e12c201fad13c87b3f72))
* 增加 ci 发布流程 ([00184c9](https://github.com/lhvision/helpers/commit/00184c9ffd6062545de5398180395b2359102aa2))



