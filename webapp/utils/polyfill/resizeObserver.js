import { elementOffset } from '../domUtils'

// ResizeObserver polyfill

if (typeof ResizeObserver === 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    constructor (callback) {
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

    getElementSize (el) {
      const { width, height } = el.hasOwnProperty('getBBox')
        ? el.getBBox()
        : elementOffset(el)

      return { width, height }
    }

    observe (el) {
      if (this.observables.some(observable => observable.el === el)) {
        return
      }
      this.observables.push({
        el: el,
        size: this.getElementSize(el)
      })
    }

    unobserve (el) {
      this.observables = this.observables.filter(obj => obj.el !== el)
    }

    disconnect () {
      this.observables = []
    }

    checkSize () {
      const changedEntries = this.observables.filter((obj) => {
        const { width, height } = this.getElementSize(obj.el)

        if (obj.size.height !== height || obj.size.width !== width) {
          obj.size.height = height
          obj.size.width = width

          return true
        }
      }).map(obj => obj.el)

      if (changedEntries.length) {
        this.callback(changedEntries)
      }
      this.af = window.requestAnimationFrame(this.checkSize)
    }

    terminate () {
      window.cancelAnimationFrame(this.af)
    }
  }
}
