const R = require('ramda')

const {sendOk, sendErr} = require('../serverUtils/response')
const {getRestParam, getBoolParam} = require('../serverUtils/request')

const {
  fetchCodeListById,
  validateCodeListProps,
} = require('../survey/surveyManager')

const {
  validateCodeListLevels,
  validateCodeListItems,
} = require('../../server/codeList/codeListValidator')

const {
  insertCodeList, insertCodeListLevel, insertCodeListItem,
  fetchCodeListItemsByCodeListId,
  updateCodeListProp, updateCodeListLevelProp, updateCodeListItemProp,
  deleteCodeList, deleteCodeListLevel, deleteCodeListItem,
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

  // fetch code list items by parent id
  app.get('/survey/:surveyId/codeLists/:codeListId/items', async (req, res) => {
    try {
      const draft = getBoolParam(req, 'draft')
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const parentId = getRestParam(req, 'parentId')

      const allItems = await fetchCodeListItemsByCodeListId(surveyId, codeListId, draft)
      const items = R.filter(item => parentId ? item.parentId === parentId : item.parentId === null)(allItems)

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

      await updateCodeListProp(surveyId, codeListId, body)
      const validation = await validateCodeListProps(surveyId, codeListId)

      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/codeLists/:codeListId/levels/:levelId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const levelId = getRestParam(req, 'levelId')
      const {body} = req

      const level = await updateCodeListLevelProp(surveyId, levelId, body)

      const codeList = await fetchCodeListById(surveyId, codeListId, true)

      const validation = await validateCodeListLevels(codeList)

      res.json({
        level,
        validation,
      })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/codeLists/:codeListId/items/:itemId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const itemId = getRestParam(req, 'itemId')

      const {body} = req

      const item = await updateCodeListItemProp(surveyId, itemId, body)
      console.log(item)
      const items = await fetchCodeListItemsByCodeListId(surveyId, codeListId, true)
      const siblingItemsValidation = await validateCodeListItems(items, item.parentId)

      res.json({
        item,
        siblingItemsValidation,
      })
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

  app.delete('/survey/:surveyId/codeLists/:codeListId/items/:itemId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const itemId = getRestParam(req, 'itemId')

      await deleteCodeListItem(surveyId, itemId)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}
