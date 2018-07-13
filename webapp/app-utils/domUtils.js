export const elementOffset = el => {
  const rect = el.getBoundingClientRect()

  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  return {
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
  }
}

export const clickedOutside = (el, evt) => !el.contains(evt.target)