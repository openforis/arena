const axios = require('axios')

const { SERVICE_URL } = require('../config')

const sendCommand = async ({ command }) => axios.post(SERVICE_URL, command)

const instanceCommands = {
  delete: ({ userId }) => ({ command: 'DELETE', payload: { userId } }),
  getStatus: () => ({ command: 'GET_STATUS' }),
}

module.exports = {
  instanceCommands,
  sendCommand,
}
