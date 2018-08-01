const R = require('ramda')

const leftTrim = R.replace(/^\s+/, '')

const normalizeName = R.pipe(
  leftTrim,
  R.toLower,
  R.replace(/[^a-z0-9]/g, '_'),
  R.slice(0, 60),
)

module.exports = {
  normalizeName,
}
