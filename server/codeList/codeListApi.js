const {sendOk, sendErr} = require('../serverUtils/response')

const {getRestParam, getBoolParam, getJsonParam} = require('../serverUtils/request')

const {toUUIDIndexedObj} = require('../../common/survey/surveyUtils')

const {
  insertCodeList,
  insertCodeListLevel,
  insertCodeListItem,
  fetchCodeListById,
  fetchCodeListsBySurveyId,
  fetchCodeListItemsByParentUUID,
  fetchCodeListItemByUUID,
  updateCodeListProp,
  updateCodeListLevelProp,
  updateCodeListItemProp,
  deleteCodeList,
  deleteCodeListLevel,
  deleteCodeListItem,
} = require('../codeList/codeListManager')

const {requireSurveyEditPermission} = require('../authGroup/authMiddleware')

const sendValidatedCodeList = async (surveyId, codeListId, res, rest = {}) => {
  const codeList = await fetchCodeListById(surveyId, codeListId, true, true)

  res.json({codeList, ...rest})
}

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/codeLists', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')

      const {body} = req

      const codeList = await insertCodeList(surveyId, body)

      res.json({codeList})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/codeLists/:codeListId/levels', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const {body} = req

      await insertCodeListLevel(surveyId, codeListId, body)

      await sendValidatedCodeList(surveyId, codeListId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/codeLists/:codeListId/items', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')

      const {body} = req

      const item = await insertCodeListItem(surveyId, body)

      await sendValidatedCodeList(surveyId, codeListId, res, {item})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  app.get(`/survey/:surveyId/codeLists`, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      const codeLists = await fetchCodeListsBySurveyId(surveyId, draft, validate)

      res.json({codeLists: toUUIDIndexedObj(codeLists)})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // fetch code list items by parent item UUID
  app.get('/survey/:surveyId/codeLists/:codeListId/items', async (req, res) => {
    try {
      const draft = getBoolParam(req, 'draft')
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const parentUUID = getRestParam(req, 'parentUUID')

      const items = await fetchCodeListItemsByParentUUID(surveyId, codeListId, parentUUID, draft)

      res.json({items})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/codeLists/items/:itemUUID', async (req, res) => {
    try {
      const draft = getBoolParam(req, 'draft')
      const surveyId = getRestParam(req, 'surveyId')
      const itemUUID = getRestParam(req, 'itemUUID')

      const item = await fetchCodeListItemByUUID(surveyId, itemUUID, draft)

      res.json({item})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/codeLists/:codeListId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const {body} = req
      const {key, value} = body

      await updateCodeListProp(surveyId, codeListId, key, value)

      await sendValidatedCodeList(surveyId, codeListId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/codeLists/:codeListId/levels/:levelId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const levelId = getRestParam(req, 'levelId')
      const {body} = req
      const {key, value} = body

      await updateCodeListLevelProp(surveyId, levelId, key, value)

      await sendValidatedCodeList(surveyId, codeListId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/codeLists/:codeListId/items/:itemId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const itemId = getRestParam(req, 'itemId')
      const {body} = req
      const {key, value} = body

      await updateCodeListItemProp(surveyId, itemId, key, value)

      await sendValidatedCodeList(surveyId, codeListId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/codeLists/:codeListId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')

      await deleteCodeList(surveyId, codeListId)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/codeLists/:codeListId/levels/:levelId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const levelId = getRestParam(req, 'levelId')

      await deleteCodeListLevel(surveyId, levelId)

      await sendValidatedCodeList(surveyId, codeListId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/codeLists/:codeListId/items/:itemId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const codeListId = getRestParam(req, 'codeListId')
      const itemId = getRestParam(req, 'itemId')

      await deleteCodeListItem(surveyId, itemId)

      await sendValidatedCodeList(surveyId, codeListId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}
