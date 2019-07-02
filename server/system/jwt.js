const axios = require('axios')
const jwkToPem = require('jwk-to-pem')
const jsonwebtoken = require('jsonwebtoken')
const R = require('ramda')

const region = process.env.COGNITO_REGION
const poolId = process.env.COGNITO_USER_POOL_ID
const issuer = `https://cognito-idp.${region}.amazonaws.com/${poolId}`

const verificationOptions = {
  algorithms: ['RS256'],
  issuer,
}

const getKeys = async (region, poolId) => {
  const jwksUrl = issuer + '/.well-known/jwks.json'
  const response = await axios.get(jwksUrl)

  return response.data.keys
}

// Index keys by "kid", and convert to PEM
const indexKeys = keyList => keyList.reduce((keys, jwk) => {
  keys[jwk.kid] = jwkToPem(jwk)
  return keys
}, {})

const decode = token => jsonwebtoken.decode(token, { complete: true })

// Now we need to decode our token, to find the verification key
const findVerificationKey = token => pemList => {
  const decoded = decode(token)
  return pemList[decoded.header.kid]
}

// Verify our token
const verifyToken = token => pem =>
  jsonwebtoken.verify(token, pem, verificationOptions)

let keys

const validate = async token => {
  keys = keys || await getKeys(region, poolId)

  return R.pipe(
    indexKeys,
    findVerificationKey(token),
    verifyToken(token),
    // checkTokenToUse,
  )(keys)
}

module.exports = {
  validate,
}