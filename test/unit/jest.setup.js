const crypto = require('crypto')

if (typeof global.crypto === 'undefined') {
  global.crypto = crypto.webcrypto
}
