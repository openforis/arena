import R from 'r-script'
import * as FileUtils from '@server/utils/file/fileUtils'

export const init = (app) => {
  // ====== READ - Chain entity data
  app.get('/r-executor', async (req, res, next) => {
    try {
      const fileName = '../rScripts/survey.R'
      const fileInitSrc = FileUtils.join(__dirname, fileName)

      const out = R(fileInitSrc).data('hello world', new Date().toISOString()).callSync()

      const data = { hello: out }
      res.json(data)
    } catch (error) {
      next(error)
    }
  })
}
