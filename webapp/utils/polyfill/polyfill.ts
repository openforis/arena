import { Buffer } from 'buffer/'

import ResizeObserver from './resizeObserver'

window.ResizeObserver ??= ResizeObserver
// the browser has no Buffer: use the buffer package one
global.Buffer ??= Buffer as unknown as BufferConstructor
