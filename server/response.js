const status = {
  ok: 'ok',
  error: 'error'
}

const sendOk = res => res.json({status: status.ok})

const sendErr = (res, err) => {
  console.log("=== ERROR ")
  console.log(err)

  res.status(500).json({
    status: status.error,
    error: 'Could not serve',
    err
  })
}

module.exports = {
  sendOk,
  sendErr
}
