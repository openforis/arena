const {sendErr} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {insertCodeList, fetchCodeListsBySurveyId} = require('./codeListRepository')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:id/codeLists', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'id')
      const {body} = req

      const codeList = await insertCodeList(surveyId, body)

      res.json({codeList})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  // fetch code lists
  app.get('/survey/:id/codeLists', async (req, res) => {
    try {

      const draft = getRestParam(req, 'draft') === 'true'
      const surveyId = getRestParam(req, 'id')

      const codeLists = await fetchCodeListsBySurveyId(surveyId, draft)

      res.json({codeLists})
    } catch (err) {
      sendErr(res, err)
    }
  })
}
