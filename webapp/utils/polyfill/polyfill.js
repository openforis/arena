import { Buffer } from 'buffer/'

import ResizeObserver from './resizeObserver'

if (window.ResizeObserver === undefined) {
  window.ResizeObserver = ResizeObserver
}
global.Buffer = global.Buffer || Buffer
