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

  // Record events
  recordDelete: 'recordDelete',
  recordSessionExpired: 'recordSessionExpired',

  // Survey Events
  surveyUpdate: 'surveyUpdate',

  // temp auth token events
  tempLoginSuccessful: 'tempLoginSuccessful',
}
