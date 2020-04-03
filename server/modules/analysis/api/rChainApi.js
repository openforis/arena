import * as CategoryItem from '@core/survey/categoryItem'
import * as ApiRoutes from '@common/apiRoutes'

import FileZip from '@server/utils/file/fileZip'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as RChainService from '@server/modules/analysis/service/rChainService'
// import * as CSVReader from '@server/utils/file/csvReader'

export const init = (app) => {
  // ====== READ - Step Data
  app.get(
    ApiRoutes.rChain.stepEntityData(':surveyId', ':stepUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, stepUuid } = Request.getParams(req)

        const data = await RChainService.fetchStepData(surveyId, cycle, stepUuid)

        res.json(data)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Category items
  app.get(
    ApiRoutes.rChain.categoryItemsData(':surveyId', ':categoryUuid'),
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, language, draft } = Request.getParams(req)

        const items = await CategoryService.fetchItemsByParentUuid(surveyId, categoryUuid, null, draft)

        const itemsSummary = items.map((item) => ({
          uuid: CategoryItem.getUuid(item),
          code: CategoryItem.getCode(item),
          label: CategoryItem.getLabel(language)(item),
        }))
        res.json(itemsSummary)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== UPDATE - Step results
  app.put(
    ApiRoutes.rChain.stepEntityData(':surveyId', ':stepUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const file = Request.getFile(req)
        const fileZip = new FileZip(file.tempFilePath)
        await fileZip.init()

        // const entryName = 'tree.csv'
        //
        // // fileZip.getEntryNames().forEach((entryName) => {
        // console.log('====== entryName')
        // console.log(entryName)
        // const entryData = fileZip.getEntryData(entryName)
        // const entryAsText = fileZip.getEntryAsText(entryName)
        // console.log('====== entryData')
        // console.log(entryData)
        // console.log('====== entryAsText')
        // console.log(entryAsText)
        // // })
        // let headers = null
        // await CSVReader.createReaderFromStream(
        //   await fileZip.getEntryStream(entryName),
        //   (headersRead) => {
        //     headers = headersRead
        //   },
        //   async (row) => {
        //     console.log('==== reading row')
        //     headers.forEach((header) => {
        //       console.log('= header ', header)
        //       console.log('= value ', row[header])
        //     })
        //   }
        // ).start()

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )
  // ====== DELETE - Chain node results
  app.delete(
    ApiRoutes.rChain.chainNodeResults(':surveyId', ':chainUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, chainUuid } = Request.getParams(req)

        await RChainService.deleteNodeResults(surveyId, cycle, chainUuid)

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )
}
