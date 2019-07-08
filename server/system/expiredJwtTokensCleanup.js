const schedule = require('node-schedule')

const AuthService = require('../modules/auth/service/authService')

const init = () =>
  schedule.scheduleJob('0 1 * * *', () => {
    const timeSeconds = Math.floor(new Date().getTime() / 1000)

    // Give one hour margin
    AuthService.deleteExpiredJwtTokens(timeSeconds - 60 * 60)
  })

module.exports = {
  init
}