import exifr from 'exifr'

import { Objects } from '@openforis/arena-core'

import * as Authorizer from '@core/auth/authorizer'
import * as ProcessUtils from '@core/processUtils'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import { sendFile, sendOk, setContentTypeFile } from '@server/utils/response'
import * as JobUtils from '@server/job/jobUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as User from '@core/user/user'
import * as Record from '@core/record/record'
import * as RecordFile from '@core/record/recordFile'
import * as Node from '@core/record/node'
import * as DateUtils from '@core/dateUtils'
import { FileFormats } from '@core/fileFormats'

import * as SurveyService from '@server/modules/survey/service/surveyService'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'
import * as RecordService from '../service/recordService'
import * as FileService from '../service/fileService'

import {
  requireRecordAnalysisPermission,
  requireRecordCreatePermission,
  requireRecordEditPermission,
  requireRecordListExportPermission,
  requireRecordListViewPermission,
  requireRecordOwnerChangePermission,
  requireRecordStepEditPermission,
  requireRecordViewPermission,
  requireRecordsEditPermission,
  requireRecordsExportPermission,
} from '../../auth/authApiMiddleware'

const fetchRecordNodeFileAsStream = async ({ surveyId, nodeUuid }) => {
  const node = await RecordService.fetchNodeByUuid(surveyId, nodeUuid)
  const fileUuid = Node.getFileUuid(node)
  const file = await FileService.fetchFileSummaryByUuid(surveyId, fileUuid)
  const fileName = await RecordService.generateNodeFileNameForDownload({ surveyId, nodeUuid, file })
  const contentStream = await FileService.fetchFileContentAsStream({ surveyId, fileUuid })
  return { fileName, file, contentStream }
}

export const init = (app) => {
  // ==== CREATE
  app.post('/survey/:surveyId/record', requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId } = Request.getParams(req)
      const recordToCreate = Request.getBody(req)
      const socketId = Request.getSocketId(req)

      if (Record.getOwnerUuid(recordToCreate) !== User.getUuid(user)) {
        throw new Error('Error record create. User is different')
      }

      await RecordService.createRecord({ socketId, user, surveyId, recordToCreate })

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.post('/survey/:surveyId/record/fromspditem', requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, cycle, itemUuid } = Request.getParams(req)

      const recordUuid = await RecordService.createRecordFromSamplingPointDataItem({ user, surveyId, cycle, itemUuid })

      res.json(recordUuid)
    } catch (error) {
      next(error)
    }
  })

  app.post('/survey/:surveyId/record/:recordUuid/node', requireRecordEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, cycle, draft, timezoneOffset } = Request.getParams(req)
      const node = Request.getJsonParam(req, 'node')
      const file = Request.getFile(req)
      const socketId = Request.getSocketId(req)

      await RecordService.persistNode({ socketId, user, surveyId, cycle, draft, node, file, timezoneOffset })

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.post('/survey/:surveyId/records/clone', requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, cycleFrom, cycleTo, recordsUuids } = Request.getParams(req)

      const job = RecordService.startRecordsCloneJob({ user, surveyId, cycleFrom, cycleTo, recordsUuids })
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
      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/records/count/by-step', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle } = Request.getParams(req)

      const countsByStep = await RecordService.countRecordsBySurveyIdGroupedByStep({ surveyId, cycle })
      res.json(countsByStep)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/record', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuid } = Request.getParams(req)

      const record = await RecordService.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
      res.json(record)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/records', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)

      const recordsSummary = await RecordService.fetchRecordsUuidAndCycle({ surveyId })
      res.json(recordsSummary)
    } catch (error) {
      next(error)
    }
  })

  const determineOwnerUuidForQuery = async ({ req, surveyId }) => {
    const user = Request.getUser(req)
    const surveyInfo = await SurveyService.fetchSurveyById({ surveyId })
    const canViewNotOwnedRecords = Authorizer.canViewNotOwnedRecords(user, surveyInfo)
    return canViewNotOwnedRecords ? null : User.getUuid(user)
  }

  app.get('/survey/:surveyId/records/summary/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, search } = Request.getParams(req)

      const ownerUuid = await determineOwnerUuidForQuery({ req, surveyId })
      const count = await RecordService.countRecordsBySurveyId({ surveyId, cycle, search, ownerUuid })
      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/records/summary', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, includeCounts, limit, offset, recordUuid, sortBy, sortOrder, search } =
        Request.getParams(req)

      const ownerUuid = await determineOwnerUuidForQuery({ req, surveyId })

      const recordsSummary = await RecordService.fetchRecordsSummaryBySurveyId({
        surveyId,
        cycle,
        includeCounts,
        offset,
        limit,
        ownerUuid,
        recordUuid,
        sortBy,
        sortOrder,
        search,
      })
      res.json(recordsSummary)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/records/summary/export', requireRecordListExportPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, fileFormat = FileFormats.xlsx } = Request.getParams(req)

      await RecordService.exportRecordsSummary({ res, surveyId, cycle, fileFormat })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/records/dashboard/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, from, to, addDate = false, countType = 'default' } = Request.getParams(req)

      let counts
      switch (countType) {
        case 'user':
          counts = addDate
            ? await RecordService.fetchRecordCreatedCountsByDatesAndUser(surveyId, cycle, from, to)
            : await RecordService.fetchRecordCreatedCountsByUser(surveyId, cycle, from, to)
          break
        case 'step':
          counts = await RecordService.fetchRecordCountsByStep(surveyId, cycle)
          break
        default:
          counts = await RecordService.fetchRecordCreatedCountsByDates(surveyId, cycle, from, to)
          break
      }

      res.json(counts)
    } catch (error) {
      next(error)
    }
  })

  // records export (only specified uuids)
  app.post('/survey/:surveyId/records/export', requireRecordsExportPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)
      const recordUuids = Request.getJsonParam(req, 'recordUuids')
      const user = Request.getUser(req)

      if (Objects.isEmpty(recordUuids)) {
        throw new Error('record uuids not specified')
      }

      const job = RecordService.startRecordsExportJob({ user, surveyId, recordUuids })
      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (error) {
      next(error)
    }
  })

  // download generated record export file
  app.get('/survey/:surveyId/records/export/download', requireRecordsExportPermission, async (req, res, next) => {
    try {
      const { surveyName, fileName } = Request.getParams(req)

      const path = FileUtils.join(ProcessUtils.ENV.tempFolder, fileName)
      const prefix = 'arena_records'
      const date = DateUtils.nowFormatDefault()
      sendFile({ res, path, name: `${prefix}_${surveyName}_${date}.zip` })
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

        const { fileName, file, contentStream } = await fetchRecordNodeFileAsStream({ surveyId, nodeUuid })
        setContentTypeFile({ res, fileName, fileSize: RecordFile.getSize(file) })
        contentStream.pipe(res)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/record/:recordUuid/nodes/:nodeUuid/file-exif',
    requireRecordViewPermission,
    async (req, res, next) => {
      let tempFilePath
      try {
        const { surveyId, nodeUuid } = Request.getParams(req)
        const { contentStream } = await fetchRecordNodeFileAsStream({ surveyId, nodeUuid })
        ;({ tempFilePath } = await FileUtils.writeStreamToTempFile(contentStream))
        const info = await exifr.parse(tempFilePath)
        res.json(info)
      } catch (error) {
        next(error)
      } finally {
        if (tempFilePath) {
          FileUtils.deleteFile(tempFilePath)
        }
      }
    }
  )

  app.get('/survey/:surveyId/validationReport', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, offset, limit, cycle, recordUuid } = Request.getParams(req)

      const list = await RecordService.fetchValidationReport({ surveyId, cycle, offset, limit, recordUuid })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/validationReport/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, recordUuid } = Request.getParams(req)

      const count = await RecordService.countValidationReportItems({ surveyId, cycle, recordUuid })

      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  app.post(
    '/survey/:surveyId/validationReport/start-export',
    requireRecordListViewPermission,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, cycle, lang, recordUuid, fileFormat = FileFormats.xlsx } = Request.getParams(req)

        const job = RecordService.startValidationReportGenerationJob({
          user,
          surveyId,
          cycle,
          lang,
          recordUuid,
          fileFormat,
        })
        res.json(JobUtils.jobToJSON(job))
      } catch (error) {
        next(error)
      }
    }
  )

  app.get('/survey/:surveyId/validationReport/download', async (req, res, next) => {
    try {
      const { surveyId, cycle, tempFileName, fileFormat = FileFormats.xlsx } = Request.getParams(req)

      FileUtils.checkIsValidTempFileName(tempFileName)

      const survey = await SurveyService.fetchSurveyById({ surveyId })
      const outputName = ExportFileNameGenerator.generate({ survey, cycle, fileType: 'ValidationReport', fileFormat })
      const filePath = FileUtils.tempFilePath(tempFileName)
      Response.sendFile({ name: outputName, fileFormat, path: filePath, res })
    } catch (error) {
      next(error)
    }
  })

  // ==== UPDATE

  // RECORD promote / demote
  app.post('/survey/:surveyId/record/:recordUuid/step', requireRecordStepEditPermission, async (req, res, next) => {
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
      const { surveyId, recordUuid, draft, timezoneOffset } = Request.getParams(req)
      const user = Request.getUser(req)
      const socketId = Request.getSocketId(req)

      const record = await RecordService.checkIn({ socketId, user, surveyId, recordUuid, draft, timezoneOffset })

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
      const { surveyId, cycle, stepFrom, stepTo, recordUuids } = Request.getParams(req)

      const { count } = await RecordService.updateRecordsStep({ user, surveyId, cycle, stepFrom, stepTo, recordUuids })

      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  app.post('/survey/:surveyId/record/:recordUuid/owner', requireRecordOwnerChangePermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuid, ownerUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      await RecordService.updateRecordOwner({ user, surveyId, recordUuid, ownerUuid })

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.post('/survey/:surveyId/records/merge', requireRecordViewPermission, async (req, res, next) => {
    try {
      const { dryRun, surveyId, sourceRecordUuid, targetRecordUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      const { record, nodesCreated, nodesUpdated } = await RecordService.mergeRecords({
        user,
        surveyId,
        sourceRecordUuid,
        targetRecordUuid,
        dryRun,
      })
      res.json({ record, nodesCreated, nodesUpdated })
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

      await RecordService.deleteRecord({ socketId, user, surveyId, recordUuid })

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.delete('/survey/:surveyId/records', requireRecordsEditPermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuids } = Request.getParams(req)
      const user = Request.getUser(req)
      const socketId = Request.getSocketId(req)

      await RecordService.deleteRecords({ socketId, user, surveyId, recordUuids })

      sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.delete('/survey/:surveyId/record/:recordUuid/node/:nodeUuid', requireRecordEditPermission, (req, res) => {
    const { surveyId, cycle, draft, recordUuid, nodeUuid, timezoneOffset } = Request.getParams(req)
    const user = Request.getUser(req)
    const socketId = Request.getSocketId(req)

    RecordService.deleteNode({ socketId, user, surveyId, cycle, draft, recordUuid, nodeUuid, timezoneOffset })
    sendOk(res)
  })
}
