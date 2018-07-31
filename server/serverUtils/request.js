const R = require('ramda')

const getRestParam = (req, param) => {
  const queryValue = R.path(['query', param], req)
  const paramsValue = R.path(['params', param], req)
  const bodyValue = R.path(['body', param], req)

  return queryValue || paramsValue || bodyValue
}

module.exports = {
  getRestParam
}