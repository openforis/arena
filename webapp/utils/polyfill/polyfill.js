import ResizeObserver from './resizeObserver'

if (typeof ResizeObserver === 'undefined') {
  window.ResizeObserver = ResizeObserver
}
