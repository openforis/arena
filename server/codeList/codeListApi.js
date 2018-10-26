const {sendOk, sendErr} = require('../serverUtils/response')
const {getRestParam, getBoolParam, getJsonParam} = require('../serverUtils/request')

const {
  insertCodeList,
  insertCodeListLevel,
  insertCodeListItem,
  fetchCodeListById,
  fetchCodeListsBySurveyId,
  fetchCodeListItemsByCodeListId,
  fetchCodeListItemsByParentId,
  fetchCodeListItemsByAncestorCodes,
  updateCodeListProp,
  updateCodeListLevelProp,
  updateCodeListItemProp,
  deleteCodeList,
  deleteCodeListLevel,
  deleteCodeListItem,
} = require('../codeList/codeListManager')

const {
  validateCodeListLevels,
  validateCodeListItems,
} = require('../../server/codeList/codeListValidator')

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

      res.json({
        level,
        itemsValidation: await validateAllCodeListItems(surveyId, codeListId),
      })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/codeLists/:codeListId/items', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')

      const {body} = req

      const item = await insertCodeListItem(surveyId, body)

      res.json({
        item,
        itemsValidation: await validateAllCodeListItems(surveyId, codeListId),
      })
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

      const items = await fetchCodeListItemsByParentId(surveyId, codeListId, parentId, draft)

      res.json({items})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // fetch code list items by ancestor codes
  app.get('/survey/:surveyId/codeLists/:codeListId/candidateItems', async (req, res) => {
    try {
      const draft = getBoolParam(req, 'draft')
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const ancestorCodes = getJsonParam(req, 'ancestorCodes')

      const items = await fetchCodeListItemsByAncestorCodes(surveyId, codeListId, ancestorCodes, draft)

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
      const {key, value} = body

      await updateCodeListProp(surveyId, codeListId, key, value)
      const codeLists = await fetchCodeListsBySurveyId(surveyId, true)

      res.json({codeLists})
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
      const {key, value} = body

      const level = await updateCodeListLevelProp(surveyId, levelId, key, value)

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
      const {key, value} = body

      const item = await updateCodeListItemProp(surveyId, itemId, key, value)

      res.json({
        item,
        itemsValidation: await validateAllCodeListItems(surveyId, codeListId),
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
      const codeListId = getRestParam(req, 'codeListId')
      const levelId = getRestParam(req, 'levelId')

      await deleteCodeListLevel(surveyId, levelId)

      res.json({
        itemsValidation: await validateAllCodeListItems(surveyId, codeListId),
      })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/codeLists/:codeListId/items/:itemId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const itemId = getRestParam(req, 'itemId')

      await deleteCodeListItem(surveyId, itemId)

      res.json({
        itemsValidation: await validateAllCodeListItems(surveyId, codeListId),
      })
    } catch (err) {
      sendErr(res, err)
    }
  })

  const validateAllCodeListItems = async (surveyId, codeListId) => {
    const items = await fetchCodeListItemsByCodeListId(surveyId, codeListId, true)
    const codeList = await fetchCodeListById(surveyId, codeListId, true)
    return await validateCodeListItems(codeList, items, null)
  }

}
