import type { SharedWorkerMessage } from '../hash'
import { calculateMD5 } from '../hash'

declare global {
  let onconnect: (event: MessageEvent) => void
}

onconnect = (event: MessageEvent) => {
  const port = event.ports[0]

  port.onmessage = async (event: MessageEvent<SharedWorkerMessage>) => {
    const { blob, ...rest } = event.data

    const arrayBuffer = await blob.arrayBuffer()
    const hash = await calculateMD5(arrayBuffer)
    port.postMessage({ hash, ...rest }) // 返回索引和哈希值
  }
}
