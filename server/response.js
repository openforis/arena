const status = {
  ok: 'ok',
  error: 'error'
}

const sendOkResp = resp => resp.json({status:status.ok})

module.exports = {
  sendOkResp
}
