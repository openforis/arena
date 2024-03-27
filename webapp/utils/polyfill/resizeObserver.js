import { elementOffset } from '../domUtils'

// ResizeObserver polyfill
export default class ResizeObserver {
  constructor(callback) {
    this.observables = []
    // Array of observed elements that looks like this:
    // [{
    //   el: domNode,
    //   size: {height: x, width: y}
    // }]
    this.checkSize = this.checkSize.bind(this)
    this.callback = callback

    this.checkSize()
  }

  getElementSize(el) {
    const { width, height, x, y } = el.getBBox ? el.getBBox() : elementOffset(el)
    return { width, height, x, y }
  }

  observe(el) {
    if (!this.observables.some((observable) => observable.el === el)) {
      this.observables.push({
        el,
        size: this.getElementSize(el),
      })
    }
  }

  unobserve(el) {
    this.observables = this.observables.filter((obj) => obj.el !== el)
  }

  disconnect() {
    this.observables = []
    window.cancelAnimationFrame(this.af)
  }

  checkSize() {
    const changedEntries = this.observables
      .filter((obj) => {
        const { width, height, x, y } = this.getElementSize(obj.el)
        const size = obj.size

        if (size.height !== height || size.width !== width || size.x !== x || size.y !== y) {
          obj.size = { width, height, x, y }
          return true
        }

        return false
      })
      .map((obj) => obj.el)

    if (changedEntries.length > 0) {
      this.callback(changedEntries)
    }

    this.af = window.requestAnimationFrame(this.checkSize)
  }
}
