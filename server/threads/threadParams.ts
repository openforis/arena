import * as A from '@core/arena'

export const keys = {
  cycle: 'cycle',
  draft: 'draft',
  socketId: 'socketId',
  surveyId: 'surveyId',
  user: 'user',
}

export const getSocketId = (params: Record<string, any>): string | undefined => A.prop(keys.socketId)(params)
