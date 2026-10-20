import * as A from '@core/arena'

export const keys = {
  cycle: 'cycle',
  draft: 'draft',
  socketId: 'socketId',
  surveyId: 'surveyId',
  user: 'user',
}

export const getSocketId = A.prop(keys.socketId)
