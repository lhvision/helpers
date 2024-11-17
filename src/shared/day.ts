interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * 计算两个时间点之间的时间差
 * @param targetDate 目标日期
 * @param startDate 起始日期（可选，默认为当前时间）
 * @returns 包含剩余天数、小时、分钟和秒数的对象
 */
export function getTimeRemaining(
  targetDate: Date | number | string,
  startDate: Date | number | string = new Date(),
): TimeRemaining {
  const target = new Date(targetDate).getTime()
  const start = new Date(startDate).getTime()
  const diff = target - start

  // 如果目标时间小于起始时间，则返回 0
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    }
  }

  // 计算总的剩余毫秒数
  const totalSeconds = Math.floor(diff / 1000)

  // 计算天数、小时、分钟和秒数
  const days = Math.floor(totalSeconds / 86400) // 86400 = 24 * 60 * 60
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
  }
}

const TIME_UNITS = ['天', '时', '分', '秒']

/**
 * 格式化时间差显示
 * @param targetDate 目标日期
 * @param startDate 起始日期（可选，默认为当前时间）
 * @param showFull 是否显示完整格式（可选，默认 false）
 * @returns 格式化后的字符串
 */
export function formatCountdown(
  targetDate: Date | number | string,
  {
    startDate = new Date(),
    showFull = false,
  }: {
    startDate?: Date | number | string
    showFull?: boolean
  },
): string {
  const time = getTimeRemaining(targetDate, startDate)
  const parts: string[] = []

  Object.values(time).forEach((value, index) => {
    if (!showFull && parts.length === 2) {
      return
    }
    if (value) {
      parts.push(`${value} ${TIME_UNITS[index]}`)
    }
    else if (index === TIME_UNITS.length - 1 && !parts.length) {
      parts.push(`${value} ${TIME_UNITS[index]}`)
    }
  })
  return parts.join(' ')
}

/**
 * 某一个日期在当年的第几天
 * @param date 日期
 * @returns 第几天
 */
export function getDayOfYear(date: Date): number {
  const year = date.getFullYear()
  const start = new Date(`${year}-01-01T00:00:00Z`)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}
