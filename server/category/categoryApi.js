const { sendErr } = require('../serverUtils/response')

const { getRestParam, getBoolParam } = require('../serverUtils/request')

const { toUuidIndexedObj } = require('../../common/survey/surveyUtils')
const AuthMiddleware = require('../authGroup/authMiddleware')

const CategoryManager = require('./categoryManager')

const sendValidatedCategory = async (surveyId, categoryUuid, res, rest = {}) => {
  const category = await CategoryManager.fetchCategoryByUuid(surveyId, categoryUuid, true, true)
  res.json({ category, ...rest })
}

const sendCategories = async (res, surveyId, draft, validate) => {
  const categories = await CategoryManager.fetchCategoriesBySurveyId(surveyId, draft, validate)
  res.json({ categories: toUuidIndexedObj(categories) })
}

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/categories', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')

      const { body, user } = req

      const category = await CategoryManager.insertCategory(user, surveyId, body)

      res.json({ category })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/categories/:categoryUuid/levels', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryUuid = getRestParam(req, 'categoryUuid')
      const { body, user } = req

      await CategoryManager.insertLevel(user, surveyId, categoryUuid, body)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/categories/:categoryUuid/items', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryUuid = getRestParam(req, 'categoryUuid')

      const { body, user } = req

      const item = await CategoryManager.insertItem(user, surveyId, body)

      await sendValidatedCategory(surveyId, categoryUuid, res, { item })
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  app.get(`/survey/:surveyId/categories`, AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      await sendCategories(res, surveyId, draft, validate)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // fetch items by parent item Uuid
  app.get('/survey/:surveyId/categories/:categoryUuid/items', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const draft = getBoolParam(req, 'draft')
      const surveyId = getRestParam(req, 'surveyId')
      const categoryUuid = getRestParam(req, 'categoryUuid')
      const parentUuid = getRestParam(req, 'parentUuid')

      const items = await CategoryManager.fetchItemsByParentUuid(surveyId, categoryUuid, parentUuid, draft)

      res.json({ items })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/categories/items/:itemUuid', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const draft = getBoolParam(req, 'draft')
      const surveyId = getRestParam(req, 'surveyId')
      const itemUuid = getRestParam(req, 'itemUuid')

      const item = await CategoryManager.fetchItemByUuid(surveyId, itemUuid, draft)

      res.json({ item })
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/categories/:categoryUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryUuid = getRestParam(req, 'categoryUuid')
      const { body, user } = req
      const { key, value } = body

      await CategoryManager.updateCategoryProp(user, surveyId, categoryUuid, key, value)

      await sendCategories(res, surveyId, true, true)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/categories/:categoryUuid/levels/:levelUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryUuid = getRestParam(req, 'categoryUuid')
      const levelUuid = getRestParam(req, 'levelUuid')
      const { body, user } = req
      const { key, value } = body

      await CategoryManager.updateLevelProp(user, surveyId, levelUuid, key, value)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/categories/:categoryUuid/items/:itemUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryUuid = getRestParam(req, 'categoryUuid')
      const itemUuid = getRestParam(req, 'itemUuid')
      const { body, user } = req
      const { key, value } = body

      await CategoryManager.updateItemProp(user, surveyId, itemUuid, key, value)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/categories/:categoryUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryUuid = getRestParam(req, 'categoryUuid')
      const { user } = req

      await CategoryManager.deleteCategory(user, surveyId, categoryUuid)

      await sendCategories(res, surveyId, true, true)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/categories/:categoryUuid/levels/:levelUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryUuid = getRestParam(req, 'categoryUuid')
      const levelUuid = getRestParam(req, 'levelUuid')
      const { user } = req

      await CategoryManager.deleteLevel(user, surveyId, levelUuid)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/categories/:categoryUuid/items/:itemUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryUuid = getRestParam(req, 'categoryUuid')
      const itemUuid = getRestParam(req, 'itemUuid')
      const { user } = req

      await CategoryManager.deleteItem(user, surveyId, itemUuid)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}
