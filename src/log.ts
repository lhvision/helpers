type ColorType = 'success' | 'info' | 'error' | 'warning' | keyof typeof colorANSIMap
type ValueOf<T> = T[keyof T]

export const colorANSIMap = {
  reset: '\x1B[0m',
  bright: '\x1B[1m',
  dim: '\x1B[2m',
  underscore: '\x1B[4m',
  blink: '\x1B[5m',
  reverse: '\x1B[7m',
  hidden: '\x1B[8m',
  fgBlack: '\x1B[30m',
  fgRed: '\x1B[31m',
  fgGreen: '\x1B[32m',
  fgYellow: '\x1B[33m',
  fgBlue: '\x1B[34m',
  fgMagenta: '\x1B[35m',
  fgCyan: '\x1B[36m',
  fgWhite: '\x1B[37m',
  bgBlack: '\x1B[40m',
  bgRed: '\x1B[41m',
  bgGreen: '\x1B[42m',
  bgYellow: '\x1B[43m',
  bgBlue: '\x1B[44m',
  bgMagenta: '\x1B[45m',
  bgCyan: '\x1B[46m',
  bgWhite: '\x1B[47m',
} as const

export function colorLog(message: string, type: ColorType = 'info') {
  let color: ValueOf<typeof colorANSIMap>

  switch (type) {
    case 'success':
      color = colorANSIMap.fgGreen
      break
    case 'info':
      color = colorANSIMap.fgBlue
      break
    case 'error':
      color = colorANSIMap.fgRed
      break
    case 'warning':
      color = colorANSIMap.fgYellow
      break
    default:
      color = colorANSIMap[type]
      break
  }

  // eslint-disable-next-line no-console
  console.log(`${color}${message}${colorANSIMap.reset}`)
}
