const {getRestParam} = require('../serverUtils/request')
const {sendOk} = require('../serverUtils/response')
const {
  fetchJobById,
  fetchActiveJobByUserId,
  cancelActiveJobByUserId,
} = require('./jobManager')

module.exports.init = app => {

  /**
   * ====== DELETE
   */
  app.delete('/jobs/active', async (req, res) => {
    const user = req.user

    await cancelActiveJobByUserId(user.id)

    sendOk(res)
  })

}