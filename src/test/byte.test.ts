import { describe, expect, it } from 'vitest'
import { BaseUsageUnitEnum, processByte } from '../byte'

describe('processByte function', () => {
  it('should convert bytes correctly with default decimal places', () => {
    expect(processByte(1024)).toBe('1 KB')
    expect(processByte(1024 ** 2)).toBe('1 MB')
    expect(processByte(1024 ** 3)).toBe('1 GB')
    expect(processByte(1024 ** 4)).toBe('1 TB')
    // Add more cases as needed
  })

  it('should handle values below the base unit', () => {
    expect(processByte(1)).toBe('1 Byte')
    expect(processByte(1023)).toBe('1023 Byte')
  })

  it('should round up when the decimal part is .5 or higher', () => {
    expect(processByte(1024 * 1.5)).toBe('1.5 KB')
    expect(processByte(1024 ** 2 * 1.5)).toBe('1.5 MB')
  })

  it('should round down when the decimal part is less than .5', () => {
    expect(processByte(1024 * 0.49)).toBe('501.76 Byte')
    expect(processByte(1024 ** 2 * 0.49)).toBe('501.76 KB')
  })

  it('should handle custom decimal places', () => {
    expect(processByte(1024 ** 2, BaseUsageUnitEnum.KB)).toBe('1 MB')
    expect(processByte(1024 ** 4, BaseUsageUnitEnum.MB)).toBe('1 TB')
  })

  it('should handle very large numbers', () => {
    expect(processByte(1024 ** 8)).toBe('1 YB')
    expect(processByte(1024 ** 8 * 1024)).toBe('1024 YB')
  })
})
