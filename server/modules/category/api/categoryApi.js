import * as Request from '@server/utils/request'
import SystemError from '@core/systemError'

import * as Category from '@core/survey/category'
import * as ObjectUtils from '@core/objectUtils'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as CategoryService from '../service/categoryService'

export const init = (app) => {
  // ==== CREATE
  app.post('/survey/:surveyId/categories', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)
      const user = Request.getUser(req)
      const categoryReq = Request.getBody(req)

      const category = await CategoryService.insertCategory(user, surveyId, categoryReq)
      res.json({ category })
    } catch (error) {
      next(error)
    }
  })

  app.post(
    '/survey/:surveyId/categories/:categoryUuid/upload',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid } = Request.getParams(req)

        const category = await CategoryService.fetchCategoryAndLevelsByUuid(surveyId, categoryUuid)

        if (Category.isPublished(category)) {
          throw new SystemError('categoryEdit.cantImportCsvIntoPublishedCategory')
        }

        const file = Request.getFile(req)

        const summary = await CategoryService.createImportSummary(file.tempFilePath)

        res.json(summary)
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/survey/:surveyId/categories/:categoryUuid/import',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid } = Request.getParams(req)
        const user = Request.getUser(req)
        const summary = Request.getBody(req)

        const job = await CategoryService.importCategory(user, surveyId, categoryUuid, summary)
        res.json({ job })
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/survey/:surveyId/categories/:categoryUuid/levels',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId } = Request.getParams(req)
        const user = Request.getUser(req)
        const level = Request.getBody(req)

        const { category } = await CategoryService.insertLevel(user, surveyId, level)

        res.json({ category })
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/survey/:surveyId/categories/:categoryUuid/items',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid } = Request.getParams(req)
        const user = Request.getUser(req)
        const itemReq = Request.getBody(req)

        const { category, item } = await CategoryService.insertItem(user, surveyId, categoryUuid, itemReq)

        res.json({ category, item })
      } catch (error) {
        next(error)
      }
    }
  )

  // ==== READ

  app.get('/survey/:surveyId/categoriesAll', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate } = Request.getParams(req)

      const categories = await CategoryService.fetchCategoriesAndLevelsBySurveyId({
        surveyId,
        draft,
        includeValidation: validate,
      })

      res.json({ categories })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/categories', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate, offset = 0, limit = null, search } = Request.getParams(req)

      const list = await CategoryService.fetchCategoriesBySurveyId({
        surveyId,
        draft,
        includeValidation: validate,
        offset,
        limit,
        search,
      })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/categories/count', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft } = Request.getParams(req)

      const count = await CategoryService.countCategories({ surveyId, draft })

      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  // Fetch items by parent item Uuid
  app.get(
    '/survey/:surveyId/categories/:categoryUuid/items',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, parentUuid, draft } = Request.getParams(req)

        const items = ObjectUtils.toUuidIndexedObj(
          await CategoryService.fetchItemsByParentUuid(surveyId, categoryUuid, parentUuid, draft)
        )

        res.json({ items })
      } catch (error) {
        next(error)
      }
    }
  )

  // ==== UPDATE

  app.put(
    '/survey/:surveyId/categories/:categoryUuid',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, key, value } = Request.getParams(req)
        const user = Request.getUser(req)

        const { categories } = await CategoryService.updateCategoryProp(user, surveyId, categoryUuid, key, value)

        res.json({ categories })
      } catch (error) {
        next(error)
      }
    }
  )

  app.put(
    '/survey/:surveyId/categories/:categoryUuid/levels/:levelUuid',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, levelUuid, key, value } = Request.getParams(req)
        const user = Request.getUser(req)

        const { category } = await CategoryService.updateLevelProp(user, surveyId, categoryUuid, levelUuid, key, value)

        res.json({ category })
      } catch (error) {
        next(error)
      }
    }
  )

  app.put(
    '/survey/:surveyId/categories/:categoryUuid/items/:itemUuid',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, itemUuid, key, value } = Request.getParams(req)
        const user = Request.getUser(req)

        const { category } = await CategoryService.updateItemProp(user, surveyId, categoryUuid, itemUuid, key, value)

        res.json({ category })
      } catch (error) {
        next(error)
      }
    }
  )

  // ==== DELETE

  app.delete(
    '/survey/:surveyId/categories/:categoryUuid',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        const categories = await CategoryService.deleteCategory(user, surveyId, categoryUuid)

        res.json({ categories })
      } catch (error) {
        next(error)
      }
    }
  )

  app.delete(
    '/survey/:surveyId/categories/:categoryUuid/levels/:levelUuid',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, levelUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        const category = await CategoryService.deleteLevel(user, surveyId, categoryUuid, levelUuid)

        res.json({ category })
      } catch (error) {
        next(error)
      }
    }
  )

  app.delete(
    '/survey/:surveyId/categories/:categoryUuid/items/:itemUuid',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, itemUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        const category = await CategoryService.deleteItem(user, surveyId, categoryUuid, itemUuid)

        res.json({ category })
      } catch (error) {
        next(error)
      }
    }
  )
}
