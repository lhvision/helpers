/**
 * 创建跟随鼠标的动态箭头光标
 * @param arrowSvg - 箭头SVG字符串或URL
 * @param size - 箭头大小
 */
export function createDynamicCursor(arrowSvg: string, size = 20) {
  // 创建光标元素
  const cursor = document.createElement('div')
  cursor.className = 'dynamic-cursor'
  document.body.appendChild(cursor)

  // 添加样式
  const style = document.createElement('style')
  style.textContent = `
    .dynamic-cursor {
      width: ${size}px;
      height: ${size}px;
      position: fixed;
      top: 0;
      left: 0;
      transform-origin: center top;
      will-change: transform;
      /* 添加硬件加速 */
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
  `
  document.head.appendChild(style)

  // 设置默认箭头SVG
  cursor.innerHTML = arrowSvg
  let rad = 0
  // 监听鼠标移动
  window.onmousemove = (e) => {
    const x = e.clientX
    const y = e.clientY
    const mx = e.movementX
    const my = e.movementY
    // 如果移动距离小于3px，则不更新光标位置和旋转
    if ((Math.abs(mx) + Math.abs(my)) < 3)
      return
    // 由于浏览器坐标系Y轴向下，这里用 -movementY
    rad = Math.atan2(mx, -my)
    // 更新光标位置和旋转
    cursor.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px) rotate(${rad}rad)`
  }
}
