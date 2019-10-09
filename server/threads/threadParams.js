const R = require('ramda')

const keys = {
  socketId: 'socketId',
  surveyId: 'surveyId',
  user: 'user',
}

const getSocketId = R.prop(keys.socketId)

module.exports = {
  keys,

  getSocketId,
}