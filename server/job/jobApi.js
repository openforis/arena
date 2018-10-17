const {getRestParam} = require('../serverUtils/request')
const {sendOk} = require('../serverUtils/response')
const {
  fetchSurveyJobById,
  fetchActiveSurveyJob,
  cancelSurveyActiveJob,
} = require('./jobManager')

module.exports.init = app => {

  /**
   * ====== READ
   */
  app.get('/surveys/:surveyId/jobs/active', async (req, res) => {
    const surveyId = getRestParam(req, 'surveyId')

    const job = await fetchActiveSurveyJob(surveyId)

    res.json({job})
  })

  app.get('/surveys/:surveyId/jobs/:jobId', async (req, res) => {
    const surveyId = getRestParam(req, 'surveyId')
    const jobId = getRestParam(req, 'jobId')

    const job = await fetchSurveyJobById(surveyId, jobId)

    res.json({job})
  })

  /**
   * ====== UPDATE
   */
  app.delete('/surveys/:surveyId/jobs/active', async (req, res) => {
    const surveyId = getRestParam(req, 'surveyId')

    await cancelSurveyActiveJob(surveyId)

    sendOk(res)
  })

}