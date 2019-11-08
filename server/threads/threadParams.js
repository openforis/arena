import * as R from 'ramda'

export const keys = {
  socketId: 'socketId',
  surveyId: 'surveyId',
  user: 'user',
}

export const getSocketId = R.prop(keys.socketId)
