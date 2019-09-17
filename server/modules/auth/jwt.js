const axios = require('axios')
const jwkToPem = require('jwk-to-pem')
const jsonwebtoken = require('jsonwebtoken')

const JwtConstants = require('../../../common/auth/jwtConstants')
const ProcessEnv = require('../../utils/processEnv')

const region = ProcessEnv.cognitoRegion
const poolId = ProcessEnv.cognitoUserPoolId
const issuer = `https://cognito-idp.${region}.amazonaws.com/${poolId}`

const verificationOptions = {
  algorithms: ['RS256'],
  issuer,
}

let indexedKeys = {}

const _getKeys = async (region, poolId) => {
  const jwksUrl = `${issuer}/.well-known/jwks.json`
  const response = await axios.get(jwksUrl)

  return response.data.keys
}

// Index keys by kid, and convert to PEM
const _indexKeys = keyList => keyList.reduce((keys, jwk) => {
  keys[jwk.kid] = jwkToPem(jwk)
  return keys
}, {})

const _decode = token => jsonwebtoken.decode(token, { complete: true })

// Now we need to decode our token, to find the verification key
const _findVerificationKey = (token, pemList) => {
  const decoded = _decode(token)
  return pemList[decoded.header.kid]
}

// Verify our token
const _verifyToken = (token, pem) =>
  jsonwebtoken.verify(token, pem, verificationOptions)

const validate = async token => {
  let verificationKey = _findVerificationKey(token, indexedKeys)

  // Refresh verification keys if none was found and search again
  if (!verificationKey) {
    indexedKeys = _indexKeys(await _getKeys(region, poolId))
    verificationKey = _findVerificationKey(token, indexedKeys)
  }

  return _verifyToken(token, verificationKey)
}

const getExpiration = token => _decode(token).payload.exp

const getJti = token => _decode(token).payload.jti

module.exports = {
  bearerPrefix: JwtConstants.bearer,

  validate,
  getExpiration,
  getJti,
}