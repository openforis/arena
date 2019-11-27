import * as axios from 'axios'
import * as jwkToPem from 'jwk-to-pem'
import * as jsonwebtoken from 'jsonwebtoken'

import * as JwtConstants from '@core/auth/jwtConstants'
import * as ProcessUtils from '@core/processUtils'

const region = ProcessUtils.ENV.cognitoRegion
const poolId = ProcessUtils.ENV.cognitoUserPoolId
const issuer = `https://cognito-idp.${region}.amazonaws.com/${poolId}`

const verificationOptions = {
  algorithms: ['RS256'],
  issuer,
}

let indexedKeys = {}

const _getKeys = async () => {
  const jwksUrl = `${issuer}/.well-known/jwks.json`
  const response = await axios.get(jwksUrl)

  return response.data.keys
}

// Index keys by kid, and convert to PEM
const _indexKeys = keyList =>
  keyList.reduce((keys, jwk) => {
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

export const validate = async token => {
  let verificationKey = _findVerificationKey(token, indexedKeys)

  // Refresh verification keys if none was found and search again
  if (!verificationKey) {
    indexedKeys = _indexKeys(await _getKeys())
    verificationKey = _findVerificationKey(token, indexedKeys)
  }

  return _verifyToken(token, verificationKey)
}

export const getExpiration = token => _decode(token).payload.exp

export const getJti = token => _decode(token).payload.jti

export const bearerPrefix = JwtConstants.bearer
