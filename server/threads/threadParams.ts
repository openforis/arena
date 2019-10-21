import * as R from 'ramda';

const keys = {
  socketId: 'socketId',
  surveyId: 'surveyId',
  user: 'user',
}

const getSocketId = R.prop(keys.socketId)

export default {
  keys,

  getSocketId,
};
