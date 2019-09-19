const Request = require('../utils/request')
const Response = require('../utils/response')

const JobManager = require('./jobManager')

const User = require('../../common/user/user')

module.exports.init = app => {

  /**
   * ====== DELETE
   */
  app.delete('/jobs/active', async (req, res) => {
    await JobManager.cancelActiveJobByUserUuid(User.getUuid(Request.getUser(req)))

    Response.sendOk(res)
  })

}