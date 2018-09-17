const {sendErr} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {
  insertCodeList, insertCodeListLevel, insertCodeListItem,
  fetchCodeListsBySurveyId, fetchCodeListItems,
  updateCodeList
} = require('./codeListRepository')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/codeLists', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const {body} = req

      const codeList = await insertCodeList(surveyId, body)

      res.json({codeList})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/codeLists/:codeListId/levels', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const {body} = req

      const level = await insertCodeListLevel(surveyId, codeListId, body)

      res.json({level})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/codeLists/:codeListId/levels/:levelId/items', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')

      const {body} = req

      const item = await insertCodeListItem(surveyId, body)

      res.json({item})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  // fetch code lists
  app.get('/survey/:surveyId/codeLists', async (req, res) => {
    try {

      const draft = getRestParam(req, 'draft') === 'true'
      const surveyId = getRestParam(req, 'surveyId')

      const codeLists = await fetchCodeListsBySurveyId(surveyId, draft)

      res.json({codeLists})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/codeLists/:codeListId/items', async (req, res) => {
    try {

      const surveyId = getRestParam(req, 'surveyId')
      const levelId = getRestParam(req, 'codeListId')
      const parentId = getRestParam(req, 'parentId')
      const draft = getRestParam(req, 'draft') === 'true'

      const items = await fetchCodeListItems(surveyId, levelId, parentId, draft)

      res.json({items})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/codeLists/:codeListId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const {body} = req

      const updatedCodeList = await updateCodeList(surveyId, body)

      res.json({codeList: updatedCodeList})
    } catch (err) {
      sendErr(res, err)
    }
  })

}
