export const WebSocketEvents = {
  // Websocket events
  connect: 'connect', // successful connection
  connection: 'connection',
  disconnect: 'disconnect',
  connectError: 'connect_error',
  reconnectAttempt: 'reconnect_attempt',

  // App events
  applicationError: 'applicationError',
  error: 'threadError',
  jobUpdate: 'jobUpdate',

  // Record update events
  nodesUpdate: 'nodesUpdate',
  nodesUpdateCompleted: 'nodesUpdateCompleted',
  nodeValidationsUpdate: 'nodeValidationsUpdate',
  // sent only to the socket that requested a node update which would clear non-applicable values
  nodesUpdateClearNonApplicableValuesConfirm: 'nodesUpdateClearNonApplicableValuesConfirm',

  // Record events
  recordDelete: 'recordDelete',
  recordSessionExpired: 'recordSessionExpired',

  // Survey Events
  surveyUpdate: 'surveyUpdate',

  // User events
  userRoleUpdate: 'userRoleUpdate',
  userRemovedFromSurvey: 'userRemovedFromSurvey',

  // AI events
  translationUpdate: 'translationUpdate',

  // temp auth token events
  tempLoginSuccessful: 'tempLoginSuccessful',
}
