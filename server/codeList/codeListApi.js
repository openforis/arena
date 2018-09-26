const R = require('ramda')

const {sendOk, sendErr} = require('../serverUtils/response')
const {getRestParam, getBoolParam} = require('../serverUtils/request')

const {getCodeListLevelsArray} = require('../../common/survey/codeList')

const {
  fetchCodeListById
} = require('../survey/surveyManager')

const {
  validateCodeListLevel,
  validateCodeListItem
} = require('../../server/codeList/codeListValidator')

const {
  insertCodeList, insertCodeListLevel, insertCodeListItem,
  fetchCodeListItemsByParentId, fetchCodeListItemsByCodeListId,
  updateCodeListProps, updateCodeListLevelProps, updateCodeListItemProps,
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

      const itemsAndValidation = await Promise.all(
        items.map(
          async item => ({
            ...item,
            validation: await validateCodeListItem(allItems, item),
          })
        )
      )
      res.json({items: itemsAndValidation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/codeLists/:codeListId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const {codeList: codeListBody} = req.body

      await updateCodeListProps(surveyId, codeListBody)
      const codeList = await fetchCodeListById(surveyId, codeListBody.id, true, true)

      res.json({codeList})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/codeLists/:codeListId/levels/:levelId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')

      const {level: levelReq} = req.body

      const level = await updateCodeListLevelProps(surveyId, levelReq)

      const codeList = await fetchCodeListById(surveyId, level.codeListId, true, false)
      const levels = getCodeListLevelsArray(codeList)

      const validation = await validateCodeListLevel(levels, level)

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

      const {item: itemReq} = req.body

      const item = await updateCodeListItemProps(surveyId, itemReq)

      const items = await fetchCodeListItemsByCodeListId(surveyId, codeListId, true)
      const validation = await validateCodeListItem(items, item)

      res.json({
        item: {
          ...item,
          validation,
        }
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
