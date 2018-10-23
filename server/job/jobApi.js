const {getRestParam} = require('../serverUtils/request')
const {sendOk} = require('../serverUtils/response')
const {
  fetchJobById,
  fetchActiveJobByUserId,
  cancelActiveJobByUserId,
} = require('./jobManager')

module.exports.init = app => {

  /**
   * ====== READ
   */
  app.get('/jobs/active', async (req, res) => {
    const user = req.user

    const job = await fetchActiveJobByUserId(user.id)

    res.json({job})
  })

  app.get('/jobs/:jobId', async (req, res) => {
    const jobId = getRestParam(req, 'jobId')

    const job = await fetchJobById(jobId)

    res.json({job})
  })

  /**
   * ====== UPDATE
   */
  app.delete('/jobs/active', async (req, res) => {
    const user = req.user

    await cancelActiveJobByUserId(user.id)

    sendOk(res)
  })

}