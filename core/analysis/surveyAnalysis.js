const R = require('ramda')

const keys = {
  processingChains: 'processingChains'
}

// ====== READ
const getProcessingChains = R.propOr([], keys.processingChains)

// ====== UPDATE
const assocProcessingChains = R.assoc(keys.processingChains)

module.exports = {
  getProcessingChains,
  assocProcessingChains,
}