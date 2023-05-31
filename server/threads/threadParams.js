import * as R from 'ramda'

export const keys = {
  cycle: 'cycle',
  draft: 'draft',
  socketId: 'socketId',
  surveyId: 'surveyId',
  user: 'user',
}

export const getSocketId = R.prop(keys.socketId)
