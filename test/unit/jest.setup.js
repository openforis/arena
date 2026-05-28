const crypto = require('node:crypto')
const streamWeb = require('node:stream/web')

if (typeof global.crypto === 'undefined') {
  global.crypto = crypto.webcrypto
}

// Jest 27's sandbox does not expose Node's global Web Streams API. The AI SDK
// v5 pulls in eventsource-parser, which references TransformStream at module
// load time. Mirror Node's `stream/web` exports onto the global so test files
// that transitively load the AI SDK can resolve them.
for (const name of [
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'ByteLengthQueuingStrategy',
  'CountQueuingStrategy',
  'TextEncoderStream',
  'TextDecoderStream',
]) {
  if (typeof global[name] === 'undefined' && streamWeb[name]) {
    global[name] = streamWeb[name]
  }
}
