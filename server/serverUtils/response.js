const UnauthorizedError = require('../authGroup/unauthorizedError')

const status = {
  ok: 'ok',
  error: 'error'
}

const sendOk = res => res.json({status: status.ok})

const sendErr = (res, err) => {
  console.log("=== ERROR ")
  console.log(err)

  if (err instanceof UnauthorizedError) {
    res.status(403).json({
      status: status.error,
      error: err.message,
      err
    })
  } else {
    res.status(500).json({
      status: status.error,
      error: 'Could not serve',
      err
    })
  }
}

module.exports = {
  sendOk,
  sendErr
}
