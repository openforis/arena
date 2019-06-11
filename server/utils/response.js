const SystemError = require('./systemError')
const UnauthorizedError = require('./unauthorizedError')

const status = {
  ok: 'ok',
  error: 'error'
}

const contentTypes = {
  csv: 'text/csv'
}

const sendOk = res => res.json({ status: status.ok })

const _getErr = ({ key, params }) => ({
  status: status.error,
  key,
  params,
})

const sendErr = (res, err) => {
  if (err instanceof UnauthorizedError) {
    res.status(403).json(_getErr(err))
  } else if (err instanceof SystemError) {
    res.status(500).json(_getErr(err))
  } else {
    res.status(500).json(_getErr({
      key: 'generic',
      params: { text: `Could not serve: ${err.toString()}` },
    }))
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
