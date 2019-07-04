const schedule = require('node-schedule')

const UserService = require('../modules/user/service/userService')

const init = () =>
  schedule.scheduleJob('0 1 * * *', () => {
    const timeSeconds = Math.floor(new Date().getTime() / 1000)

    // Give one hour margin
    UserService.deleteExpiredJwtTokens(timeSeconds - 60 * 60)
  })

module.exports = {
  init
}