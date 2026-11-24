import { Buffer } from 'buffer/'

import ResizeObserver from './resizeObserver'

if (window.ResizeObserver === undefined) {
  window.ResizeObserver = ResizeObserver
}
// the browser has no Buffer: use the buffer package one
global.Buffer = global.Buffer || (Buffer as unknown as BufferConstructor)
