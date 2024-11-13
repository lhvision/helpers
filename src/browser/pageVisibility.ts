/**
 * 监听页面可见性变化
 * @param onVisible 页面变为可见时的回调
 * @param onHidden 页面变为隐藏时的回调
 * @returns 清理函数
 */
export function watchVisibility(
  onVisible?: () => void,
  onHidden?: () => void,
) {
  const handler = () => {
    if (document.hidden) {
      onHidden?.()
    }
    else {
      onVisible?.()
    }
  }

  document.addEventListener('visibilitychange', handler)

  return () => {
    document.removeEventListener('visibilitychange', handler)
  }
}
