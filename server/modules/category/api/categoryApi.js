import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import SystemError from '@core/systemError'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as ObjectUtils from '@core/objectUtils'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as SurveyService from '@server/modules/survey/service/surveyService'

import * as CategoryService from '../service/categoryService'
import * as AuthMiddleware from '../../auth/authApiMiddleware'

export const init = (app) => {
  // ==== CREATE
  app.post('/survey/:surveyId/categories', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)
      const user = Request.getUser(req)
      const categoryReq = Request.getBody(req)

      const category = await CategoryService.insertCategory({ user, surveyId, category: categoryReq })
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

        const category = await CategoryService.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid })

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

        const job = CategoryService.importCategory(user, surveyId, categoryUuid, summary)
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

        const { category } = await CategoryService.insertLevel({ user, surveyId, level })

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

  // categories export (start job)
  app.post(
    '/survey/:surveyId/categories/export',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, draft = false } = Request.getParams(req)
        const user = Request.getUser(req)

        const job = CategoryService.exportAllCategories({ user, surveyId, draft })
        res.json({ job })
      } catch (error) {
        next(error)
      }
    }
  )

  // categories export (download generated zip file)
  app.get(
    '/survey/:surveyId/categories/export/download',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, draft = false, tempFileName } = Request.getParams(req)
        const survey = await SurveyService.fetchSurveyById({ surveyId, draft })
        const surveyInfo = Survey.getSurveyInfo(survey)
        const name = `${Survey.getName(surveyInfo)}_categories.zip`
        const exportedFilePath = FileUtils.tempFilePath(tempFileName)

        Response.sendFile({
          res,
          path: exportedFilePath,
          name,
          contentType: Response.contentTypes.zip,
        })
      } catch (error) {
        next(error)
      }
    }
  )

  // ==== READ

  app.get('/survey/:surveyId/categories', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate, offset = 0, limit = null, search = '' } = Request.getParams(req)

      const categoriesByUuid = await CategoryService.fetchCategoriesAndLevelsBySurveyId({
        surveyId,
        draft,
        includeValidation: validate,
        offset,
        limit,
        search,
      })

      res.json({ list: Object.values(categoriesByUuid) })
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

  // Fetch item by uuid
  app.get(
    '/survey/:surveyId/categories/:categoryUuid',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, draft, validate } = Request.getParams(req)

        const category = await CategoryService.fetchCategoryAndLevelsByUuid({
          surveyId,
          categoryUuid,
          draft,
          includeValidation: validate,
        })

        res.json({ category })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/categories/:categoryUuid/export',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, draft = true } = Request.getParams(req)

        await CategoryService.exportCategory({ surveyId, categoryUuid, draft, res })
      } catch (error) {
        next(error)
      }
    }
  )

  // Fetch items by parent item uuid
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

  app.get(
    '/survey/:surveyId/sampling-point-data/count',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, levelIndex = 0 } = Request.getParams(req)

        const count = await CategoryService.countSamplingPointData({ surveyId, levelIndex })
        res.json({ count })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/sampling-point-data',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, levelIndex = 0, limit = null, offset = null } = Request.getParams(req)

        const items = await CategoryService.fetchSamplingPointData({ surveyId, levelIndex, limit, offset })
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

        const category = await CategoryService.updateCategoryProp(user, surveyId, categoryUuid, key, value)

        res.json({ category })
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

  app.put(
    '/survey/:surveyId/categories/:categoryUuid/cleanup',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        const { deleted = false, updated = false } = await CategoryService.cleanupCategory({
          user,
          surveyId,
          categoryUuid,
        })

        res.json({ deleted, updated })
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

        await CategoryService.deleteCategory(user, surveyId, categoryUuid)

        res.json({})
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
