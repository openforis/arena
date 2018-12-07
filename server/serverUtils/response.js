const UnauthorizedError = require('../authGroup/unauthorizedError')

const File = require('../../common/file/file')

const status = {
  ok: 'ok',
  error: 'error'
}

const sendOk = res => res.json({status: status.ok})

const sendErr = (res, err) => {
  console.log('=== ERROR ')
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

const sendFile = (res, file) => {
  res.setHeader('Content-Disposition', `attachment; filename=${File.getName(file)}`)
  res.setHeader('Content-Length', File.getSize(file))
  // res.set('Content-Type', 'text/csv')

  res.write(file.content, 'binary')
  res.end(null, 'binary')
}

module.exports = {
  sendOk,
  sendErr,
  sendFile
}
