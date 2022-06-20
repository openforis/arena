import * as FileUtils from '@server/utils/file/fileUtils'
import * as Request from '@server/utils/request'

export const init = (app) => {
  app.post('/r-executor/survey/:surveyId/chain/:chainUuid/script/execute/start', async (req, res, next) => {
    try {
      const filePath = Object.values(req.files)[0].tempFilePath
      const content = await FileUtils.readFile(filePath)
      res.json({ a: 'OK' })
    } catch (error) {
      next(error)
    }
  })

  app.post('/r-executor/survey/:surveyId/chain/:chainUuid/script/execute/status', async (req, res, next) => {
    try {
      const filePath = Object.values(req.files)[0].tempFilePath
      const content = await FileUtils.readFile(filePath)
      res.json({ a: 'OK' })
    } catch (error) {
      next(error)
    }
  })
}
