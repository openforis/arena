export const WebSocketEvents = {
  // websocket events
  connection: 'connection',
  disconnect: 'disconnect',
  connectError: 'connect_error',
  reconnectAttempt: 'reconnect_attempt',

  // app events
  jobUpdate: 'jobUpdate',
  nodesUpdate: 'nodesUpdate',
  nodesUpdateCompleted: 'nodesUpdateCompleted',
  nodeValidationsUpdate: 'nodeValidationsUpdate',
  recordDelete: 'recordDelete',
  error: 'threadError',
  recordSessionExpired: 'recordSessionExpired',
  applicationError: 'applicationError',
}
