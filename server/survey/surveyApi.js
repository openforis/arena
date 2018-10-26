const {sendErr} = require('../serverUtils/response')
const {
  getRestParam,
  getBoolParam,
} = require('../serverUtils/request')

const {
  createSurvey,

  fetchSurveyById,
  fetchUserSurveys,
  fetchSurveyNodeDefs,

  updateSurveyProp,
  publishSurvey,
} = require('./surveyManager')

const {
  validateNewSurvey,
  validateSurveyProp
} = require('./surveyValidator')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey', async (req, res) => {
    try {

      const {user, body} = req
      const validation = await validateNewSurvey(body)

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
  app.get('/surveys', async (req, res) => {
    try {
      const {user} = req

      const surveys = await fetchUserSurveys(user)

      res.json({surveys})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:id', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'id')
      const draft = getBoolParam(req, 'draft')

      const survey = await fetchSurveyById(surveyId, draft)

      res.json({survey})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get(`/survey/:id/nodeDefs`, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'id')
      const draft = getBoolParam(req, 'draft')

      const nodeDefs = await fetchSurveyNodeDefs(surveyId, draft, draft)

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }
  })
  // ==== UPDATE

  app.put('/survey/:id/prop', async (req, res) => {
    try {
      const {body, user} = req
      const {key, value} = body

      const surveyId = getRestParam(req, 'id')

      const survey = await updateSurveyProp(surveyId, key, value, user)
      const validation = await validateSurveyProp(survey, key)

      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:id/publish', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'id')

      const survey = await publishSurvey(surveyId)

      res.json({survey})

    } catch (err) {
      sendErr(res, err)
    }
  })

}
