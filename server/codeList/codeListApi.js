const {sendErr} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {
  insertCodeList, insertCodeListLevel, insertCodeListItem,
  fetchCodeListsBySurveyId,
  updateCodeList, updateCodeListLevel, updateCodeListItem,
} = require('./codeListRepository')

const {
  fetchCodeListById,
} = require('./codeListManager')

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

  // fetch code list by id
  app.get('/survey/:surveyId/codeLists/:codeListId', async (req, res) => {
    try {
      const draft = getRestParam(req, 'draft') === 'true'
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')

      const codeList = await fetchCodeListById(surveyId, codeListId, draft)

      res.json({codeList})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/codeLists/:codeListId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      //const codeListId = getRestParam(req, 'codeListId')
      const {codeList} = req.body

      const updatedCodeList = await updateCodeList(surveyId, codeList)

      res.json({codeList: updatedCodeList})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/codeLists/:codeListId/levels/:levelId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      //const codeListId = getRestParam(req, 'codeListId')
      //const levelId = getRestParam(req, 'levelId')

      const {level} = req.body

      const updatedLevel = await updateCodeListLevel(surveyId, level)

      res.json({level: updatedLevel})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/codeLists/:codeListId/items/:itemId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      //const codeListId = getRestParam(req, 'codeListId')
      //const itemId = getRestParam(req, 'itemId')

      const {item} = req.body

      const updatedItem = await updateCodeListItem(surveyId, item)

      res.json({item: updatedItem})
    } catch (err) {
      sendErr(res, err)
    }
  })

}
