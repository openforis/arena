import ResizeObserver from './resizeObserver'

if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = ResizeObserver
}
global.Buffer = global.Buffer || require('buffer').Buffer
