import { describe, expect, it } from 'vitest'
import { formatCountdown, getDayOfYear, getMonthCalendar, getTimeRemaining } from '../day'

describe('day', () => {
  describe('getTimeRemaining', () => {
    it('应该正确计算两个时间点之间的差值', () => {
      const targetDate = new Date('2024-12-31T00:00:00Z')
      const startDate = new Date('2024-12-30T12:30:30Z')

      const remaining = getTimeRemaining(targetDate, startDate)
      expect(remaining).toEqual({
        days: 0,
        hours: 11,
        minutes: 29,
        seconds: 30,
      })
    })

    it('当目标时间小于开始时间时应返回全零对象', () => {
      const targetDate = new Date('2024-01-01')
      const startDate = new Date('2024-12-31')

      const remaining = getTimeRemaining(targetDate, startDate)
      expect(remaining).toEqual({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      })
    })

    it('应该支持字符串格式的日期输入', () => {
      const remaining = getTimeRemaining('2024-12-31', '2024-12-30')
      expect(remaining.days).toBeGreaterThanOrEqual(0)
    })
  })

  describe('formatCountdown', () => {
    it('应该正确格式化倒计时（默认模式）', () => {
      const targetDate = new Date('2024-12-31T00:00:00Z')
      const startDate = new Date('2024-12-30T12:00:00Z')

      const formatted = formatCountdown(targetDate, { startDate })
      expect(formatted).toBe('12 时')
    })

    it('应该在完整模式下显示所有时间单位', () => {
      const targetDate = new Date('2024-12-31T00:00:00Z')
      const startDate = new Date('2024-12-29T12:00:00Z')

      const formatted = formatCountdown(targetDate, {
        startDate,
        showFull: true,
      })
      expect(formatted).toBe('1 天 12 时')
    })

    it('当剩余时间为零时应显示0秒', () => {
      const targetDate = new Date()
      const formatted = formatCountdown(targetDate, {
        startDate: targetDate,
      })
      expect(formatted).toBe('0 秒')
    })
  })

  describe('getDayOfYear', () => {
    it('应该正确计算平年中的天数', () => {
      const date = new Date('2023-03-01')
      expect(getDayOfYear(date)).toBe(60) // 1月31天 + 2月28天 + 1天
    })

    it('应该正确计算闰年中的天数', () => {
      const date = new Date('2024-03-01')
      expect(getDayOfYear(date)).toBe(61) // 1月31天 + 2月29天 + 1天
    })

    it('应该正确处理年末日期', () => {
      const date = new Date('2023-12-31')
      expect(getDayOfYear(date)).toBe(365)
    })
  })

  describe('getMonthCalendar', () => {
    it('默认应该从周日开始', () => {
      const calendar = getMonthCalendar(2024, 3)

      // 2024年3月1日是周五，在周日开始模式下，前面应该有5天（周日到周四）
      expect(calendar.slice(0, 5)).toEqual([
        { date: 25, month: 2, year: 2024, isCurrentMonth: false },
        { date: 26, month: 2, year: 2024, isCurrentMonth: false },
        { date: 27, month: 2, year: 2024, isCurrentMonth: false },
        { date: 28, month: 2, year: 2024, isCurrentMonth: false },
        { date: 29, month: 2, year: 2024, isCurrentMonth: false },
      ])
    })

    it('从周一开始时应正确偏移日期', () => {
      const calendar = getMonthCalendar(2024, 3, true)

      // 2024年3月1日是周五，在周一开始模式下，前面应该有4天（周一到周四）
      expect(calendar.slice(0, 4)).toEqual([
        { date: 26, month: 2, year: 2024, isCurrentMonth: false },
        { date: 27, month: 2, year: 2024, isCurrentMonth: false },
        { date: 28, month: 2, year: 2024, isCurrentMonth: false },
        { date: 29, month: 2, year: 2024, isCurrentMonth: false },
      ])
    })

    it('月初是周日时的处理（周一开始模式）', () => {
      const calendar = getMonthCalendar(2024, 9, true)

      // 2024年9月1日是周日，应该排在第一周的最后一天
      expect(calendar[6]).toEqual({
        date: 1,
        month: 9,
        year: 2024,
        isCurrentMonth: true,
      })

      // 第一周的前6天应该是8月的最后几天
      expect(calendar.slice(0, 6)).toEqual([
        { date: 26, month: 8, year: 2024, isCurrentMonth: false },
        { date: 27, month: 8, year: 2024, isCurrentMonth: false },
        { date: 28, month: 8, year: 2024, isCurrentMonth: false },
        { date: 29, month: 8, year: 2024, isCurrentMonth: false },
        { date: 30, month: 8, year: 2024, isCurrentMonth: false },
        { date: 31, month: 8, year: 2024, isCurrentMonth: false },
      ])
    })

    it('月初是周一时的处理（周一开始模式）', () => {
      const calendar = getMonthCalendar(2024, 4, true)

      // 2024年4月1日是周一，应该是数组的第一个元素
      expect(calendar[0]).toEqual({
        date: 1,
        month: 4,
        year: 2024,
        isCurrentMonth: true,
      })
    })

    it('月末补充日期测试（周一开始模式）', () => {
      const calendar = getMonthCalendar(2024, 3, true)

      // 2024年3月31日是周日，在周一开始模式下应补充到下周末
      const lastWeek = calendar.slice(-7)
      expect(lastWeek).toEqual([
        { date: 25, month: 3, year: 2024, isCurrentMonth: true },
        { date: 26, month: 3, year: 2024, isCurrentMonth: true },
        { date: 27, month: 3, year: 2024, isCurrentMonth: true },
        { date: 28, month: 3, year: 2024, isCurrentMonth: true },
        { date: 29, month: 3, year: 2024, isCurrentMonth: true },
        { date: 30, month: 3, year: 2024, isCurrentMonth: true },
        { date: 31, month: 3, year: 2024, isCurrentMonth: true },
      ])
    })

    it('跨年月份的处理（周一开始模式）', () => {
      const calendar = getMonthCalendar(2024, 12, true)

      // 检查月末跨年的日期
      const lastDays = calendar.filter(day => !day.isCurrentMonth && day.year === 2025)
      expect(lastDays.every(day => day.month === 1)).toBe(true)

      // 确保年份正确转换
      expect(lastDays[0]).toEqual({
        date: 1,
        month: 1,
        year: 2025,
        isCurrentMonth: false,
      })
    })

    it('不同模式下日历长度应该是7的倍数', () => {
      const calendarSunday = getMonthCalendar(2024, 3)
      const calendarMonday = getMonthCalendar(2024, 3, true)

      expect(calendarSunday.length % 7).toBe(0)
      expect(calendarMonday.length % 7).toBe(0)
    })

    it('应该返回正确的2024年3月日历', () => {
      const calendar = getMonthCalendar(2024, 3)

      // 检查数组长度
      expect(calendar).toHaveLength(42)

      // 检查月初
      expect(calendar[4]).toEqual({
        date: 29,
        month: 2,
        year: 2024,
        isCurrentMonth: false,
      })

      // 检查当月第一天
      expect(calendar[5]).toEqual({
        date: 1,
        month: 3,
        year: 2024,
        isCurrentMonth: true,
      })
    })

    it('应该正确处理跨年的情况', () => {
      const calendar = getMonthCalendar(2023, 12)

      // 检查12月的最后几天
      expect(calendar[30]).toEqual({
        date: 26,
        month: 12,
        year: 2023,
        isCurrentMonth: true,
      })

      // 检查下一年的开始
      expect(calendar[31]).toEqual({
        date: 27,
        month: 12,
        year: 2023,
        isCurrentMonth: true,
      })
    })

    it('应该正确处理月份转换', () => {
      const calendar = getMonthCalendar(2024, 1)
      // 检查上一年12月补充日
      const lastDayOfPrevMonth = calendar.find(day =>
        day.month === 12 && day.year === 2023,
      )
      expect(lastDayOfPrevMonth?.isCurrentMonth).toBe(false)

      // 检查2月的补充日
      const firstDayOfNextMonth = calendar.find(day =>
        day.month === 2 && day.year === 2024,
      )
      expect(firstDayOfNextMonth?.isCurrentMonth).toBe(false)
    })
  })
})
