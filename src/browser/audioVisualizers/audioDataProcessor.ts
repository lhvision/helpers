export class AudioDataProcessor {
  /** 频谱数据数组 */
  private dataArray: Uint8Array | null = null
  /** 分析器 */
  private analyser: AnalyserNode | null = null
  /** 音频源 */
  private source: MediaElementAudioSourceNode | null = null

  constructor(private fftSize: number) {}

  /** 初始化音频处理器 */
  async init(audioContext: AudioContext, audioElement: HTMLAudioElement) {
    try {
      // 如果已经存在连接，先断开
      if (this.source) {
        this.cleanup()
      }

      // 创建分析器
      this.analyser = audioContext.createAnalyser()

      try {
        // 创建音频源
        this.source = audioContext.createMediaElementSource(audioElement)
      }
      catch (error) {
        // 如果是 InvalidStateError，说明已经连接过，需要重新获取 source
        if (error instanceof DOMException && error.name === 'InvalidStateError') {
          // 获取已连接的 source
          const existingSource = audioContext.destination.numberOfInputs > 0
          if (!existingSource) {
            throw new Error('Unable to connect to audio element')
          }
          // 使用已存在的连接
          this.source = existingSource as unknown as MediaElementAudioSourceNode
        }
        else {
          throw error
        }
      }

      // 连接音频源和分析器
      this.source.connect(this.analyser)
      // 连接分析器到音频上下文的输出
      this.analyser.connect(audioContext.destination)

      // 设置分析器FFT大小
      this.analyser.fftSize = this.fftSize
      // 创建频谱数据数组
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    }
    catch (error) {
      console.error('Failed to initialize audio processor:', error)
      throw error
    }
  }

  /** 获取处理后的音频数据 */
  processAudioData(segments: number): number[] | null {
    if (!this.analyser || !this.dataArray)
      return null

    // 获取频谱数据
    this.analyser.getByteFrequencyData(this.dataArray)
    // 将频谱数据数组转换为数组
    const frequencyData = Array.from(this.dataArray)
    // 插值处理频谱数据
    return this.interpolateArray(frequencyData, segments)
  }

  /** 数据插值方法 */
  private interpolateArray(data: number[], fitCount: number): number[] {
    // 将数据转换为数组
    const normalized = Array.from(data)
    // 创建插值数组
    const interpolated: number[] = []
    // 计算插值因子
    const springFactor = (normalized.length - 1) / (fitCount - 1)
    // 设置插值数组第一个元素
    interpolated[0] = normalized[0]

    for (let i = 1; i < fitCount - 1; i++) {
      // 计算插值因子
      const tmp = i * springFactor
      // 计算插值因子前一个元素
      const before = Math.floor(tmp)
      // 计算插值因子后一个元素
      const after = Math.ceil(tmp)
      // 计算插值因子在两个元素之间的位置
      const atPoint = tmp - before
      // 设置插值数组元素
      interpolated[i] = normalized[before] + (normalized[after] - normalized[before]) * atPoint
    }

    // 设置插值数组最后一个元素
    interpolated[fitCount - 1] = normalized[normalized.length - 1]
    return interpolated
  }

  /** 清理资源 */
  cleanup() {
    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    this.dataArray = null
  }
}
