const {sendOk, sendErr} = require('../serverUtils/response')

const {createSurvey, updateSurveyProp} = require('./surveyRepository')
const {validateCreateSurvey} = require('./surveyValidator')
const {getRestParam} = require('../serverUtils/request')

module.exports.init = app => {

  app.post('/survey', async (req, res) => {
    try {

      const {user, body} = req
      const validation = await validateCreateSurvey(body)

      if (validation.valid) {
        const survey = await createSurvey(user, body)

        res.json({survey})
      } else {
        res.json({validation})
      }

    } catch (err) {
      sendErr(res, err)
    }

  })

  app.put('/survey/:id/prop', async (req, res) => {
    const {user, body} = req

    const surveyId = getRestParam(req, 'id')

    try {
      await updateSurveyProp(surveyId, body)

      res.json({result: 'ok'})
    } catch (err) {
      sendErr(res, err)
    }
  })

}
