import * as Request from '@server/utils/request'
import { sendOk, sendFileContent, setContentTypeFile, contentTypes } from '@server/utils/response'
import * as JobUtils from '@server/job/jobUtils'

import * as User from '@core/user/user'
import * as Record from '@core/record/record'
import * as RecordFile from '@core/record/recordFile'
import * as Node from '@core/record/node'

import * as RecordService from '../service/recordService'
import * as FileService from '../service/fileService'

import {
  requireRecordListViewPermission,
  requireRecordEditPermission,
  requireRecordCreatePermission,
  requireRecordViewPermission,
  requireRecordCleansePermission,
} from '../../auth/authApiMiddleware'
import { DataImportTemplateService } from '@server/modules/dataImport/service/dataImportTemplateService'

export const init = (app) => {
  // ==== CREATE
  app.post('/survey/:surveyId/record', requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId } = Request.getParams(req)
      const record = Request.getBody(req)
      const socketId = Request.getSocketId(req)

      if (Record.getOwnerUuid(record) !== User.getUuid(user)) {
        throw new Error('Error record create. User is different')
      }

      await RecordService.createRecord(socketId, user, surveyId, record)

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.post('/survey/:surveyId/record/:recordUuid/node', requireRecordEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId } = Request.getParams(req)
      const node = Request.getJsonParam(req, 'node')
      const file = Request.getFile(req)
      const socketId = Request.getSocketId(req)

      await RecordService.persistNode(socketId, user, surveyId, node, file)

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.post('/survey/:surveyId/record/importfromcollect', requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, deleteAllRecords, cycle, forceImport } = Request.getParams(req)
      const file = Request.getFile(req)

      const job = RecordService.startCollectDataImportJob({
        user,
        surveyId,
        filePath: file.tempFilePath,
        deleteAllRecords,
        cycle,
        forceImport,
      })
      const jobSerialized = JobUtils.jobToJSON(job)
      res.json({ job: jobSerialized })
    } catch (error) {
      next(error)
    }
  })

  app.post('/survey/:surveyId/record/importfromcsv', requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, cycle, entityDefUuid, insertNewRecords } = Request.getParams(req)
      const filePath = Request.getFilePath(req)

      const job = RecordService.startCSVDataImportJob({
        user,
        surveyId,
        filePath,
        cycle,
        entityDefUuid,
        insertNewRecords,
      })
      const jobSerialized = JobUtils.jobToJSON(job)
      res.json({ job: jobSerialized })
    } catch (error) {
      next(error)
    }
  })

  // ==== READ

  app.get('/survey/:surveyId/records/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, search } = Request.getParams(req)

      const count = await RecordService.countRecordsBySurveyId({ surveyId, cycle, search })
      res.json(count)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/record', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, recordUuid } = Request.getParams(req)

      const record = await RecordService.fetchRecordAndNodesByUuid({ surveyId, cycle, recordUuid })
      res.json(record)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/records', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)

      const recordsSummary = await RecordService.fetchRecordsUuidAndCycle(surveyId)
      res.json(recordsSummary)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/records/summary', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, limit, offset, sortBy, sortOrder, search } = Request.getParams(req)

      const recordsSummary = await RecordService.fetchRecordsSummaryBySurveyId({
        surveyId,
        cycle,
        offset,
        limit,
        sortBy,
        sortOrder,
        search,
      })
      res.json(recordsSummary)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/records/dashboard/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, from, to } = Request.getParams(req)

      const counts = await RecordService.fetchRecordCreatedCountsByDates(surveyId, cycle, from, to)

      res.json(counts)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/records/summary/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, search } = Request.getParams(req)

      const count = await RecordService.countRecordsBySurveyId({ surveyId, cycle, search })
      res.json(count)
    } catch (error) {
      next(error)
    }
  })

  app.get(
    '/survey/:surveyId/record/:recordUuid/nodes/:nodeUuid/file',
    requireRecordViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, nodeUuid } = Request.getParams(req)

        const node = await RecordService.fetchNodeByUuid(surveyId, nodeUuid)
        const file = await FileService.fetchFileByUuid(surveyId, Node.getFileUuid(node))

        sendFileContent(res, RecordFile.getName(file), RecordFile.getContent(file), RecordFile.getSize(file))
      } catch (error) {
        next(error)
      }
    }
  )

  app.get('/survey/:surveyId/validationReport', requireRecordCleansePermission, async (req, res, next) => {
    try {
      const { surveyId, offset, limit, cycle, recordUuid } = Request.getParams(req)

      const list = await RecordService.fetchValidationReport({ surveyId, cycle, offset, limit, recordUuid })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/validationReport/count', requireRecordCleansePermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, recordUuid } = Request.getParams(req)

      const count = await RecordService.countValidationReportItems({ surveyId, cycle, recordUuid })

      res.json(count)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/record/importfromcsv/template', requireRecordCreatePermission, async (req, res, next) => {
    try {
      const { surveyId, entityDefUuid, cycle } = Request.getParams(req)

      setContentTypeFile({ res, fileName: 'data_import_template.csv', contentType: contentTypes.csv })

      await DataImportTemplateService.writeDataImportTemplateToStream({
        surveyId,
        cycle,
        entityDefUuid,
        outputStream: res,
      })
    } catch (error) {
      next(error)
    }
  })

  // ==== UPDATE

  // RECORD promote / demote
  app.post('/survey/:surveyId/record/:recordUuid/step', requireRecordEditPermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuid, step } = Request.getParams(req)
      const user = Request.getUser(req)

      await RecordService.updateRecordStep(user, surveyId, recordUuid, step)

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  // RECORD Check in / out
  app.post('/survey/:surveyId/record/:recordUuid/checkin', requireRecordViewPermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuid, draft } = Request.getParams(req)
      const user = Request.getUser(req)
      const socketId = Request.getSocketId(req)

      const record = await RecordService.checkIn(socketId, user, surveyId, recordUuid, draft)

      res.json({ record })
    } catch (error) {
      next(error)
    }
  })

  app.post('/survey/:surveyId/record/:recordUuid/checkout', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, recordUuid } = Request.getParams(req)
      const socketId = Request.getSocketId(req)

      await RecordService.checkOut(socketId, user, surveyId, recordUuid)

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  // update records' step in batch from one step into another
  app.post('/survey/:surveyId/records/step', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, cycle, stepFrom, stepTo } = Request.getParams(req)

      const { count } = await RecordService.updateRecordsStep({ user, surveyId, cycle, stepFrom, stepTo })

      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  // ==== DELETE
  app.delete('/survey/:surveyId/record/:recordUuid', requireRecordEditPermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuid } = Request.getParams(req)
      const user = Request.getUser(req)
      const socketId = Request.getSocketId(req)

      await RecordService.deleteRecord(socketId, user, surveyId, recordUuid)

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.delete('/survey/:surveyId/records', requireRecordEditPermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuids } = Request.getParams(req)
      const user = Request.getUser(req)

      await RecordService.deleteRecords({ user, surveyId, recordUuids })

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.delete('/survey/:surveyId/record/:recordUuid/node/:nodeUuid', requireRecordEditPermission, (req, res) => {
    const { surveyId, recordUuid, nodeUuid } = Request.getParams(req)
    const user = Request.getUser(req)
    const socketId = Request.getSocketId(req)

    RecordService.deleteNode(socketId, user, surveyId, recordUuid, nodeUuid)
    sendOk(res)
  })
}
