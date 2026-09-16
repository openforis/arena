import { StatusCodes } from 'http-status-codes'

import * as RecordPrintableExportShareService from '@server/modules/record/service/recordPrintableExportShareService'

export const init = (app) => {
  app.get('/public/record-export/:token', async (req, res, next) => {
    try {
      const { token } = req.params
      const result = await RecordPrintableExportShareService.fetchValidPdfByToken({ token })
      if (!result) {
        res.status(StatusCodes.NOT_FOUND).end()
        return
      }
      res.setHeader('Content-Type', result.contentType)
      res.setHeader('Content-Disposition', 'inline; filename="record-export.pdf"')
      res.status(StatusCodes.OK).send(result.buffer)
    } catch (error) {
      next(error)
    }
  })
}
