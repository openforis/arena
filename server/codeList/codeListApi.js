const {sendOk, sendErr} = require('../serverUtils/response')
const {getRestParam, getIntParam, getBoolParam} = require('../serverUtils/request')

const {
  insertCodeList, insertCodeListLevel, insertCodeListItem,
  fetchCodeListsBySurveyId, fetchCodeListItemsByParentId,
  updateCodeListProps, updateCodeListLevelProps, updateCodeListItemProps,
  deleteCodeList, deleteCodeListLevel,
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

  app.post('/survey/:surveyId/codeLists/:codeListId/items', async (req, res) => {
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

      const draft = getBoolParam(req, 'draft')
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
      const draft = getBoolParam(req, 'draft')
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')

      const codeList = await fetchCodeListById(surveyId, codeListId, draft)

      res.json({codeList})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // fetch code list items by parent id
  app.get('/survey/:surveyId/codeLists/:codeListId/items', async (req, res) => {
    try {
      const draft = getBoolParam(req, 'draft')
      const surveyId = getIntParam(req, 'surveyId')
      const codeListId = getIntParam(req, 'codeListId')
      const parentId = getIntParam(req, 'parentId')

      const items = await fetchCodeListItemsByParentId(surveyId, codeListId, parentId, draft)

      res.json({items})
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

      const updatedCodeList = await updateCodeListProps(surveyId, codeList)

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

      const updatedLevel = await updateCodeListLevelProps(surveyId, level)

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

      const updatedItem = await updateCodeListItemProps(surveyId, item)

      res.json({item: updatedItem})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/codeLists/:codeListId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')

      await deleteCodeList(surveyId, codeListId)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/codeLists/:codeListId/levels/:levelId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const levelId = getRestParam(req, 'levelId')

      await deleteCodeListLevel(surveyId, levelId)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}
