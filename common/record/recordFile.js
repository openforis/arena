const R = require('ramda')

const {uuidv4} = require('../uuid')

const {truncate} = require('../stringUtils')

const getProp = prop => R.path(['props', prop])

const keys = {
  props: 'props',
  content: 'content'
}

const propKeys = {
  name: 'name',
  size: 'size'
}

const createFile = fileReq => ({
  uuid: uuidv4(),
  [keys.props]: {
    [propKeys.name]: fileReq.name,
    [propKeys.size]: fileReq.data.length,
  },
  [keys.content]: fileReq.data
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
  //CREATE
  createFile,

  // READ
  getName: getProp(propKeys.name),
  getSize: getProp(propKeys.size),
  getContent: getProp(keys.content),

  // UTILS
  truncateFileName,
}