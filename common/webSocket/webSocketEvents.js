const webSocketEvents = {
  // websocket events
  connection: 'connection',
  disconnect: 'disconnect',
  connectError: 'connect_error',
  reconnectAttempt: 'reconnect_attempt',

  // app events
  jobUpdate: 'jobUpdate',
  nodesUpdate: 'nodesUpdate',
  nodeValidationsUpdate: 'nodeValidationsUpdate',
  recordDelete: 'recordDelete',
  error: 'threadError',
  recordSessionExpired: 'recordSessionExpired',
}

module.exports = webSocketEvents