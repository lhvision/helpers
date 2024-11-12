## 2.0.6 (2024-11-12)


### Bug Fixes

* 修复 build 后不该保留的代码注释 ([fc92004](https://github.com/lhvision/helpers/commit/fc920043af9e92eb2f2a742fa64fc6318a1f6fa0))


### Features

* request 新增直接返回 Response 对象参数 rawResponse 以用于流式下载等场景 ([f778ac2](https://github.com/lhvision/helpers/commit/f778ac2bd62f0c89a1bbade5ecff91e37d712fe3))
* 优化 audioVisualizer, 新增防抖节流函数 ([646e11c](https://github.com/lhvision/helpers/commit/646e11c56ab4412e85aa5c95cedd59ccfb85f3bc))
* 因为 RequestManager 为单例，调整 request 为单独导出 ([f3323d5](https://github.com/lhvision/helpers/commit/f3323d5c4382914de8e1e16da96b38e9a770c5cc))
* 新增 getEyeDropperColor 函数，优化 audio 生成频谱图类 ([ab387b7](https://github.com/lhvision/helpers/commit/ab387b79c28ad05191860763889b45d56760f632))



## <small>2.0.5 (2024-11-10)</small>

* feat: 优化 audioVisualizer, 新增防抖节流函数 ([646e11c](https://github.com/lhvision/helpers/commit/646e11c56ab4412e85aa5c95cedd59ccfb85f3bc))



## <small>2.0.4 (2024-11-07)</small>

* feat: 新增 getEyeDropperColor 函数，优化 audio 生成频谱图类 ([ab387b7](https://github.com/lhvision/helpers/commit/ab387b7))



## <small>2.0.3 (2024-11-06)</small>

* feat: request 新增直接返回 Response 对象参数 rawResponse 以用于流式下载等场景 ([f778ac2](https://github.com/lhvision/helpers/commit/f778ac2))



## <small>2.0.2 (2024-11-06)</small>

* fix: 修复 build 后不该保留的代码注释 ([fc92004](https://github.com/lhvision/helpers/commit/fc92004))



## <small>2.0.1 (2024-11-06)</small>

* feat: 调整 request 拦截器现在可以为不同的域名注册拦截器或者默认的拦截器，新增 audio 频谱图生成函数 ([0aa8337](https://github.com/lhvision/helpers/commit/0aa8337))



## 2.0.0 (2024-11-05)

* feat: 新增 request、download、uploadFileInChunks、stream 相关函数 ([1df1d7a](https://github.com/lhvision/helpers/commit/1df1d7a))


### BREAKING CHANGE

* 从 2.0 开始移除了 CJS 产物只支持 ESM


## <small>1.0.7 (2024-10-30)</small>

* feat: 调整 upload 作为独立的模块 ([2218cbb](https://github.com/lhvision/helpers/commit/2218cbb))



## <small>1.0.6 (2024-10-29)</small>

* fix: 调整 largeFileHashWithWorkers 实现，新增默认命令创建一个 worker/hashWorker.ts 文件 ([e466d99](https://github.com/lhvision/helpers/commit/e466d99))



## <small>1.0.5 (2024-10-29)</small>

* fix: 删除 byte.ts 中的意外导出，调整 upload 中的 worker 引入为内联 ([ee37eb2](https://github.com/lhvision/helpers/commit/ee37eb2))



## <small>1.0.4 (2024-10-29)</small>

* feat: 新增 md5-hash、upload、图片转 base64 相关函数 ([9fcf872](https://github.com/lhvision/helpers/commit/9fcf872))



## <small>1.0.3 (2024-10-16)</small>

* feat: 新增 LRUCache，AsyncLRUCache 类实现 ([711ca0a](https://github.com/lhvision/helpers/commit/711ca0a))



## <small>1.0.2 (2024-10-16)</small>

* feat: 新增 fullScreen 操作相关函数 ([ab7f6d5](https://github.com/lhvision/helpers/commit/ab7f6d5))



## <small>1.0.1 (2024-10-15)</small>

* feat: 同步上一个发布的版本内容 ([21fb328](https://github.com/lhvision/helpers/commit/21fb328))



## 1.0.0 (2024-05-22)

* init ([354b820](https://github.com/lhvision/helpers/commit/354b820))
* Initial commit ([c09e628](https://github.com/lhvision/helpers/commit/c09e628))



