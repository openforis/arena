const Request = require('../utils/request')
const Response = require('../utils/response')

const JobManager = require('./jobManager')

module.exports.init = app => {

  /**
   * ====== DELETE
   */
  app.delete('/jobs/active', async (req, res) => {
    await JobManager.cancelActiveJobByUserUuid(Request.getUserUuid(req))

    Response.sendOk(res)
  })

}