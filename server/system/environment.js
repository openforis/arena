const R = require('ramda')

const keys = {
  tempFolder: 'TEMP_FOLDER'
}

const defaultTempFolder = '/tmp/arena_upload'

const tempFolder = R.propOr(defaultTempFolder, keys.tempFolder)(process.env)

module.exports = {
  tempFolder
}