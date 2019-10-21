import { elementOffset } from '../domUtils'

// ResizeObserver polyfill

// if (typeof ResizeObserver === 'undefined') {

// @ts-ignore
export default class ResizeObserver {
  observables: any[]
  callback: (x: any[]) => void
  af?: number
  constructor (callback: (x: any[]) => void) {
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

  getElementSize (el: SVGGraphicsElement) {
    const { width, height, x, y } = el.getBBox
      ? el.getBBox()
      : elementOffset(el)
    return { width, height, x, y }
  }

  observe (el: SVGGraphicsElement) {
    if (!this.observables.some(observable => observable.el === el)) {
      this.observables.push({
        el: el,
        size: this.getElementSize(el)
      })
    }
  }

  unobserve (el: SVGGraphicsElement) {
    this.observables = this.observables.filter(obj => obj.el !== el)
  }

  disconnect () {
    this.observables = []
    if (this.af !== undefined) window.cancelAnimationFrame(this.af)
  }

  checkSize () {
    const changedEntries = this.observables.filter((obj) => {
      const { width, height, x, y } = this.getElementSize(obj.el)
      const size = obj.size

      if (size.height !== height || size.width !== width || size.x !== x || size.y !== y) {
        obj.size = { width, height, x, y }
        return true
      }
    }).map(obj => obj.el)

    if (changedEntries.length) {
      this.callback(changedEntries)
    }
    this.af = window.requestAnimationFrame(this.checkSize)
  }

}
// }
