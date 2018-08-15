const { getSurveyById } = require('../survey/surveyRepository')
const { createRecord } = require('../record/recordRepository')
const { sendErr } = require('../serverUtils/response')

module.exports.init = app => {

  // ==== CREATE
  app.post('/record', async (req, res) => {
    const {user, body} = req
    const {surveyId} = body
    try {
      const survey = await getSurveyById(surveyId)

      const record = await createRecord(user, survey)

      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }

  })
}