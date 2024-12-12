/**
 * 初始化主题监听器, 设置 dark 或 light 主题
 * @returns 返回一个函数，用于移除主题监听器
 */
export function initThemeListener(setThemeCallback: (darkThemeMqMatches?: boolean) => void) {
  // 检查浏览器是否支持主题监听
  if (window.matchMedia) {
    // 创建媒体查询
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')

    // 初始化主题
    setThemeCallback(darkThemeMq.matches)

    // 添加主题变化监听器
    const listener = (e: MediaQueryListEvent) => setThemeCallback(e.matches)

    darkThemeMq.addEventListener('change', listener)

    return () => darkThemeMq.removeEventListener('change', listener)
  }
}

/** 设置主题 dark 或 light */
export function setTheme(isDark?: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

/** 使用 view transition 设置主题 */
export async function setThemeInViewTransition(isDark?: boolean, startViewTransitionCallback?: () => void) {
  await document.startViewTransition(() => {
    setTheme(isDark)
    startViewTransitionCallback?.()
  }).ready
}
