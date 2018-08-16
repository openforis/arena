const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')
const {getSurveyById} = require('../survey/surveyRepository')
const {createRecord, fetchRecordById, fetchRecordNodes} = require('../record/recordRepository')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/record', async (req, res) => {
    const {user} = req
    const surveyId = getRestParam(req, 'surveyId')
    try {
      const survey = await getSurveyById(surveyId)
      const record = await createRecord(user, survey)
      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ
  app.get('/survey/:surveyId/record/:recordId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const recordId = getRestParam(req, 'recordId')

      const record = await fetchRecordById(surveyId, recordId)
      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE
  app.put('/survey/:surveyId/record/:recordId/update', async (req, res) => {
    try {
      const {user, body} = req

      const surveyId = getRestParam(req, 'surveyId')
      const recordId = getRestParam(req, 'recordId')

      const command = body


    } catch (err) {
      sendErr(res, err)
    }
  })
}