const R = require('ramda')
const {isBlank} = require('../stringUtils')

/**
 * ======
 * UTILS
 * ======
 */
const isNodeValueBlank = value => {

  if (R.isNil(value))
    return true

  if (R.is(String, value))
    return isBlank(value)

  return false
}

const isNodeValueNotBlank = R.pipe(isNodeValueBlank, R.not)

module.exports = {

  // ==== UTILS
  isNodeValueBlank,
  isNodeValueNotBlank,
}