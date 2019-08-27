const Request = require('../../../utils/request')

const { toUuidIndexedObj } = require('../../../../common/survey/surveyUtils')
const Category = require('../../../../common/survey/category')
const AuthMiddleware = require('../../auth/authApiMiddleware')
const CategoryService = require('../service/categoryService')

const sendValidatedCategory = async (surveyId, categoryUuid, res, rest = {}) => {
  const category = await CategoryService.fetchCategoryByUuid(surveyId, categoryUuid, true, true)
  res.json({ category, ...rest })
}

const sendCategories = async (res, surveyId, draft, validate) => {
  const categories = await CategoryService.fetchCategoriesBySurveyId(surveyId, draft, validate)
  res.json({ categories: toUuidIndexedObj(categories) })
}

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/categories', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')

      const { body, user } = req

      const category = await CategoryService.insertCategory(user, surveyId, body)
      res.json({ category })
    } catch (err) {
      next(err)
    }
  })

  app.post('/survey/:surveyId/categories/:categoryUuid/upload', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, categoryUuid } = Request.getParams(req)
      const { user } = req

      const file = Request.getFile(req)

      const job = await CategoryService.importCategory(user, surveyId, categoryUuid, file.tempFilePath)
      res.json({ job })
    } catch (err) {
      next(err)
    }
  })

  app.post('/survey/:surveyId/categories/:categoryUuid/levels', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, categoryUuid } = Request.getParams(req)
      const { body, user } = req

      await CategoryService.insertLevel(user, surveyId, categoryUuid, body)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      next(err)
    }
  })

  app.post('/survey/:surveyId/categories/:categoryUuid/items', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, categoryUuid } = Request.getParams(req)

      const { body, user } = req

      const item = await CategoryService.insertItem(user, surveyId, body)

      await sendValidatedCategory(surveyId, categoryUuid, res, { item })
    } catch (err) {
      next(err)
    }
  })

  // ==== READ

  app.get(`/survey/:surveyId/categories`, AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const draft = Request.getBoolParam(req, 'draft')
      const validate = Request.getBoolParam(req, 'validate')

      await sendCategories(res, surveyId, draft, validate)
    } catch (err) {
      next(err)
    }
  })

  // fetch items by parent item Uuid
  app.get('/survey/:surveyId/categories/:categoryUuid/items', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const draft = Request.getBoolParam(req, 'draft')
      const { surveyId, categoryUuid, parentUuid } = Request.getParams(req)

      const items = await CategoryService.fetchItemsByParentUuid(surveyId, categoryUuid, parentUuid, draft)

      res.json({ items })
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/categories/items/:itemUuid', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const draft = Request.getBoolParam(req, 'draft')
      const { surveyId, itemUuid } = Request.getParams(req)

      const item = await CategoryService.fetchItemByUuid(surveyId, itemUuid, draft)

      res.json({ item })
    } catch (err) {
      next(err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/categories/:categoryUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, categoryUuid } = Request.getParams(req)
      const { body, user } = req
      const { key, value } = body

      await CategoryService.updateCategoryProp(user, surveyId, categoryUuid, key, value)

      await sendCategories(res, surveyId, true, true)
    } catch (err) {
      next(err)
    }
  })

  app.put('/survey/:surveyId/categories/:categoryUuid/levels/:levelUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, categoryUuid, levelUuid } = Request.getParams(req)
      const { body, user } = req
      const { key, value } = body

      await CategoryService.updateLevelProp(user, surveyId, levelUuid, key, value)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      next(err)
    }
  })

  app.put('/survey/:surveyId/categories/:categoryUuid/items/:itemUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, categoryUuid, itemUuid } = Request.getParams(req)
      const { body, user } = req
      const { key, value } = body

      await CategoryService.updateItemProp(user, surveyId, itemUuid, key, value)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      next(err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/categories/:categoryUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, categoryUuid } = Request.getParams(req)
      const { user } = req

      await CategoryService.deleteCategory(user, surveyId, categoryUuid)

      await sendCategories(res, surveyId, true, true)
    } catch (err) {
      next(err)
    }
  })

  app.delete('/survey/:surveyId/categories/:categoryUuid/levels/:levelUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, categoryUuid, levelUuid } = Request.getParams(req)
      const { user } = req

      await CategoryService.deleteLevel(user, surveyId, levelUuid)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      next(err)
    }
  })

  app.delete('/survey/:surveyId/categories/:categoryUuid/items/:itemUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, categoryUuid, itemUuid } = Request.getParams(req)
      const { user } = req

      await CategoryService.deleteItem(user, surveyId, itemUuid)

      await sendValidatedCategory(surveyId, categoryUuid, res)
    } catch (err) {
      next(err)
    }
  })

}
