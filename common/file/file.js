const R = require('ramda')

const {uuidv4} = require('./../uuid')

const {truncate} = require('../stringUtils')

const getProp = prop => R.path(['props', prop])

const createFile = fileReq => ({
  uuid: uuidv4(),
  props: {
    name: fileReq.name,
    size: fileReq.data.length,
  },
  content: fileReq.data
})

const getExtension = fileName => R.pipe(
  R.split('.'),
  R.tail,
)(fileName)

const truncateFileName = fileName => {
  if (fileName && !R.isEmpty(fileName)) {

    const extension = getExtension(fileName)

    return R.pipe(
      R.dropLast(extension.length + 1),
      truncate(15),
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
  getName: getProp('name'),
  getSize: getProp('size'),

  // UTILS
  truncateFileName,
}