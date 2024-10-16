export enum BaseUsageUnitEnum {
  BYTE = 'Byte',
  KB = 'KB',
  MB = 'MB',
  GB = 'GB',
  TB = 'TB',
  PB = 'PB',
  EB = 'EB',
  ZB = 'ZB',
  YB = 'YB',
}

const BaseUsageUnitValues = Object.values(BaseUsageUnitEnum)

const baseByteNum = 1024

const maxUnitIndex = BaseUsageUnitValues.indexOf(BaseUsageUnitEnum.YB)

export function processByte(
  num: number,
  defaultByteDecimal = BaseUsageUnitEnum.BYTE,
): string {
  let byteDecimal = BaseUsageUnitValues.indexOf(defaultByteDecimal)
  let currentNum = num / (1024 ** byteDecimal)
  while (currentNum >= baseByteNum && byteDecimal < maxUnitIndex) {
    currentNum /= baseByteNum
    byteDecimal++
  }
  const byteBase = 1024 ** byteDecimal
  const base = 10 ** 2
  return `${Math.round((num / byteBase) * base) / base} ${BaseUsageUnitValues[byteDecimal]}`
}
