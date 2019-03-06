const UnauthorizedError = require('../authGroup/unauthorizedError')

const status = {
  ok: 'ok',
  error: 'error'
}

const contentTypes = {
  csv: 'text/csv'
}

const sendOk = res => res.json({ status: status.ok })

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
      error: 'Could not serve: ' + err.toString(),
      err,
    })
  }
}

const sendFile = (res, name, content, size) => {
  setContentTypeFile(res, name, size)
  res.write(content, 'binary')
  res.end(null, 'binary')
}

const setContentTypeFile = (res, fileName, fileSize = null, contentType = null) => {
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
  if (fileSize)
    res.setHeader('Content-Length', fileSize)
  if (contentType)
    res.set('Content-Type', contentType)
}

module.exports = {
  contentTypes,

  sendOk,
  sendErr,
  sendFile,
  setContentTypeFile
}
