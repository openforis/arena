const R = require('ramda')

const {truncate} = require('../stringUtils')

const getProp = prop => R.path(['props', prop])

const keys = {
  props: 'props',
  content: 'content'
}

const propKeys = {
  name: 'name',
  size: 'size',
  recordUuid: 'recordUuid',
  nodeUuid: 'nodeUuid'
}

const createFile = (uuid, fileName, fileSize, content, recordUuid, nodeUuid) => ({
  uuid,
  [keys.props]: {
    [propKeys.name]: fileName,
    [propKeys.size]: fileSize,
    [propKeys.recordUuid]: recordUuid,
    [propKeys.nodeUuid]: nodeUuid
  },
  [keys.content]: content
})

const getExtension = fileName => R.pipe(
  R.split('.'),
  R.tail,
)(fileName)

const truncateFileName = (fileName, maxLength = 10) => {
  if (fileName && !R.isEmpty(fileName)) {

    const extension = getExtension(fileName)

    return R.pipe(
      R.dropLast(extension.length + 1),
      truncate(maxLength),
      name => name + '.' + extension
    )(fileName)
  } else {
    return ''
  }
}

module.exports = {
  propKeys,

  //CREATE
  createFile,

  // READ
  getName: getProp(propKeys.name),
  getSize: getProp(propKeys.size),
  getContent: R.prop(keys.content),

  // UTILS
  truncateFileName,
}