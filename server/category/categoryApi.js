const {sendErr} = require('../serverUtils/response')

const {getRestParam, getBoolParam} = require('../serverUtils/request')

const {toUUIDIndexedObj} = require('../../common/survey/surveyUtils')
const {requireSurveyEditPermission} = require('../authGroup/authMiddleware')

const CategoryManager = require('./categoryManager')

const sendValidatedCategory = async (surveyId, categoryId, res, rest = {}) => {
  const category = await CategoryManager.fetchCategoryById(surveyId, categoryId, true, true)
  res.json({category, ...rest})
}

const sendCategories = async (res, surveyId, draft, validate) => {
  const categories = await CategoryManager.fetchCategoriesBySurveyId(surveyId, draft, validate)
  res.json({categories: toUUIDIndexedObj(categories)})
}

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/categories', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')

      const {body} = req

      const category = await CategoryManager.insertCategory(surveyId, body)

      res.json({category})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/categories/:categoryId/levels', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryId = getRestParam(req, 'categoryId')
      const {body} = req

      await CategoryManager.insertLevel(surveyId, categoryId, body)

      await sendValidatedCategory(surveyId, categoryId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/categories/:categoryId/items', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryId = getRestParam(req, 'categoryId')

      const {body} = req

      const item = await CategoryManager.insertItem(surveyId, body)

      await sendValidatedCategory(surveyId, categoryId, res, {item})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  app.get(`/survey/:surveyId/categories`, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      await sendCategories(res, surveyId, draft, validate)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // fetch items by parent item UUID
  app.get('/survey/:surveyId/categories/:categoryId/items', async (req, res) => {
    try {
      const draft = getBoolParam(req, 'draft')
      const surveyId = getRestParam(req, 'surveyId')
      const categoryId = getRestParam(req, 'categoryId')
      const parentUuid = getRestParam(req, 'parentUuid')

      const items = await CategoryManager.fetchItemsByParentUuid(surveyId, categoryId, parentUuid, draft)

      res.json({items})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/categories/items/:itemUuid', async (req, res) => {
    try {
      const draft = getBoolParam(req, 'draft')
      const surveyId = getRestParam(req, 'surveyId')
      const itemUuid = getRestParam(req, 'itemUuid')

      const item = await CategoryManager.fetchItemByUuid(surveyId, itemUuid, draft)

      res.json({item})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/categories/:categoryId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryId = getRestParam(req, 'categoryId')
      const {body} = req
      const {key, value} = body

      await CategoryManager.updateCategoryProp(surveyId, categoryId, key, value)

      await sendCategories(res, surveyId, true, true)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/categories/:categoryId/levels/:levelId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryId = getRestParam(req, 'categoryId')
      const levelId = getRestParam(req, 'levelId')
      const {body} = req
      const {key, value} = body

      await CategoryManager.updateLevelProp(surveyId, levelId, key, value)

      await sendValidatedCategory(surveyId, categoryId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/categories/:categoryId/items/:itemId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryId = getRestParam(req, 'categoryId')
      const itemId = getRestParam(req, 'itemId')
      const {body} = req
      const {key, value} = body

      await CategoryManager.updateItemProp(surveyId, itemId, key, value)

      await sendValidatedCategory(surveyId, categoryId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/categories/:categoryId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryId = getRestParam(req, 'categoryId')

      await CategoryManager.deleteCategory(surveyId, categoryId)

      await sendCategories(res, surveyId, true, true)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/categories/:categoryId/levels/:levelId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryId = getRestParam(req, 'categoryId')
      const levelId = getRestParam(req, 'levelId')

      await CategoryManager.deleteLevel(surveyId, levelId)

      await sendValidatedCategory(surveyId, categoryId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/categories/:categoryId/items/:itemId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const categoryId = getRestParam(req, 'categoryId')
      const itemId = getRestParam(req, 'itemId')

      await CategoryManager.deleteItem(surveyId, itemId)

      await sendValidatedCategory(surveyId, categoryId, res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}
