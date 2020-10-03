const { requestInstance, removeInstance, checkStatus } = require('../useCases')

const commandHandlers = {
  REQUEST_RSTUDIO: requestInstance,
  GET_STATUS: checkStatus,
  DELETE: removeInstance,
}

const getCommandHandler = (body) => {
  const { command } = body
  return command ? commandHandlers[command] : false
}
exports.handler = async (event = {}) => {
  const { body = '' } = event
  const bodyParsed = JSON.parse(body)
  const { payload = {} } = bodyParsed
  const commandHandler = getCommandHandler(bodyParsed)

  let response = {
    statusCode: 400,
    body: JSON.stringify({ status: event }),
  }
  console.log('payload', payload, commandHandler)
  if (commandHandler) {
    response = commandHandler(payload)
  }
  return response
}
