const BaseUsageUnitValues = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const
const baseByteNum = 1024

export function processByte(
  num: number,
  defaultByteDecimal: typeof BaseUsageUnitValues[number] = 'Byte',
): string {
  const byteDecimal = BaseUsageUnitValues.indexOf(defaultByteDecimal)
  let currentNum = num / (1024 ** byteDecimal)
  let newByteDecimal = byteDecimal

  while (currentNum >= baseByteNum && newByteDecimal < BaseUsageUnitValues.length - 1) {
    currentNum /= baseByteNum
    newByteDecimal++
  }

  const byteBase = 1024 ** newByteDecimal
  const base = 10 ** 2
  return `${Math.round((num / byteBase) * base) / base} ${BaseUsageUnitValues[newByteDecimal]}`
}
