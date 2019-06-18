const axios = require('axios')
const jwkToPem = require('jwk-to-pem')
const jwt = require('jsonwebtoken')

const region = 'eu-west-1'
const poolId = process.env.COGNITO_USER_POOL_ID
const issuer = `https://cognito-idp.${region}.amazonaws.com/${poolId}`

console.log(poolId)

const verificationOptions = {
  algorithms: ['RS256'],
  issuer,
}

// const doSomething = console.info

// Error handling
// function handleError (err) {
//   console.error('error', err)
// }

const getKeys = async (region, poolId) => {
  let jwksUrl = issuer + '/.well-known/jwks.json'
  const response = await axios.get(jwksUrl)
  return response.data.keys
}

// Index keys by "kid", and convert to PEM
const indexKeys = keyList => {
  let result = keyList.reduce((keys, jwk) => {
    keys[jwk.kid] = jwkToPem(jwk)
    return keys
  }, {})

  return Promise.resolve(result)
}

const decode = token => jwt.decode(token, { complete: true })

// Now we need to decode our token, to find the verification key
const findVerificationKey = token => pemList => {
  let decoded = decode(token)
  return Promise.resolve(pemList[decoded.header.kid])
}

// Verify our token
const verifyToken = token => pem => {
  let verified = jwt.verify(token, pem, verificationOptions)
  return Promise.resolve(verified)
}

const validate = (token, doSomething) => {
  getKeys(region, poolId)
    .then(indexKeys)
    .then(findVerificationKey(token))
    .then(verifyToken(token))
    // .then(checkTokenUse)
    // .then(doSomething)
    // .catch(handleError)
}

// const token = 'eyJraWQiOiI3V0pIVGk0eFNxQ2FUYnpyWFVCckJlZ2pWYmdySEdjbTM0aTJEdEpuQmZzPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJiMzA1N2M4OC03MGFiLTQ2MjEtYjhlOS02NTU4ODZkNzFhNTgiLCJldmVudF9pZCI6IjM3ZWEwYzJjLWQ3M2ItNGQ0NC1hZDM5LWNhNjI2ODZmYWIwOCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE1NjA5Mzk3NDUsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5ldS13ZXN0LTEuYW1hem9uYXdzLmNvbVwvZXUtd2VzdC0xXzVYaXpSQW1uaiIsImV4cCI6MTU2MDk0MzM0NSwiaWF0IjoxNTYwOTM5NzQ1LCJqdGkiOiJmOTUxM2RkZi01OGU3LTQ1NzctOTA1YS00NzMzNjZiMTNhMGQiLCJjbGllbnRfaWQiOiIyMTk4cjJ1cWs4aHN2djBxbWFpa2t0cDFsdiIsInVzZXJuYW1lIjoiY2ljY2lvYnJ1dHRvIn0.lti74tnauKFI5NzrAkc27ufx8jfk50WBzr9ogEEhCdR-wyt8vsh5rmtop2M3BuGbXraeRB3AYo8GwDZfs7w-FX85DJARz9tuzdDMpkAxfiOahJKxzvtKJy7_b3dwSgu-MiKi4crF5aHJwrRi0b_vZrS8EkjYnapNtjvcR92A2OYZxbiEdY3995-OgZVDJTimlb-yWjHbwbh0O9u6WOl30_M-wNqYQRSynB-qkDJc33Yhw9OliYTG8BZDGSWJXMielSu2jbirv3wBGKZDz2xhUBoVEzeGixv357GQElCw6WWYoHn2VtWQJrWTYfIc4yvMWIGbOZG6m-ukv-J3TVFLKg'

// validate(token, doSomething)

module.exports = { decode, validate }