import type { Express, NextFunction, Request, Response } from 'express'

import { StatusCodes } from '@core/systemError'

import * as RecordPrintableExportShareService from '@server/modules/record/service/recordPrintableExportShareService'

export const init = (app: Express): void => {
  app.get('/public/record-export/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenParam = req.params.token
      const token = typeof tokenParam === 'string' ? tokenParam : tokenParam?.[0]
      if (!token) {
        res.status(StatusCodes.NOT_FOUND).end()
        return
      }
      const result = await RecordPrintableExportShareService.fetchValidPdfByToken({ token })
      if (!result) {
        res.status(StatusCodes.NOT_FOUND).end()
        return
      }
      res.setHeader('Content-Type', result.contentType)
      res.setHeader('Content-Disposition', 'inline; filename="record-export.pdf"')
      res.setHeader('Cache-Control', 'private, no-store')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.status(StatusCodes.OK).send(result.buffer)
    } catch (error) {
      next(error)
    }
  })
}
