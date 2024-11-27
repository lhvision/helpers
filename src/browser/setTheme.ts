/**
 * 初始化主题监听器, 设置 dark 或 light 主题
 * @returns 返回一个函数，用于移除主题监听器
 */
export function initThemeListener() {
  // 检查浏览器是否支持主题监听
  if (window.matchMedia) {
    // 创建媒体查询
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')

    // 初始化主题
    setTheme(darkThemeMq.matches)

    // 添加主题变化监听器
    const listener = (e: MediaQueryListEvent) => setTheme(e.matches)

    darkThemeMq.addEventListener('change', listener)

    return () => darkThemeMq.removeEventListener('change', listener)
  }
}

/** 设置主题 dark 或 light */
export function setTheme(isDark?: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  }
  else {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }
}
