export const WebSocketEvents = {
  // Websocket events
  connect: 'connect', // successful connection
  connection: 'connection',
  disconnect: 'disconnect',
  connectError: 'connect_error',
  reconnectAttempt: 'reconnect_attempt',

  // App events
  jobUpdate: 'jobUpdate',
  nodesUpdate: 'nodesUpdate',
  nodesUpdateCompleted: 'nodesUpdateCompleted',
  nodeValidationsUpdate: 'nodeValidationsUpdate',
  recordDelete: 'recordDelete',
  surveyUpdate: 'surveyUpdate',

  error: 'threadError',
  recordSessionExpired: 'recordSessionExpired',
  applicationError: 'applicationError',
}
