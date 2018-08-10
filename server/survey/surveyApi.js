const {sendOk, sendErr, sendValidationError} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {createSurvey, fetchRootNodeDef, updateSurveyProp} = require('./surveyRepository')
const {validateCreateSurvey, validateUpdateSurveyProp} = require('./surveyValidator')

module.exports.init = app => {

  // ==== CREATE
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

  // ==== READ

  // fetch root node definition
  app.get('/survey/:id/rootNodeDef', async (req, res) => {
    try {

      const draft = getRestParam(req, 'draft')
      const surveyId = getRestParam(req, 'id')

      const nodeDef = await fetchRootNodeDef(surveyId, draft)
      res.json({nodeDef})

    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:id/prop', async (req, res) => {
    const {body} = req

    const surveyId = getRestParam(req, 'id')

    const {key, value} = body

    try {
      await updateSurveyProp(surveyId, body)
      const validation = await validateUpdateSurveyProp(surveyId, key, value)
      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

}
