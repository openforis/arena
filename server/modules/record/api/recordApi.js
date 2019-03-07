const Request = require('../../../serverUtils/request')
const { sendErr, sendOk, sendFile } = require('../../../serverUtils/response')

const Record = require('../../../../common/record/record')
const RecordFile = require('../../../../common/record/recordFile')
const Node = require('../../../../common/record/node')

const RecordService = require('../service/recordService')
const FileManager = require('../../../file/fileManager')

const {
  requireRecordListViewPermission,
  requireRecordEditPermission,
  requireRecordCreatePermission,
  requireRecordViewPermission,
} = require('../../../authGroup/authMiddleware')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/record', requireRecordCreatePermission, async (req, res) => {
    try {
      const { user } = req
      const surveyId = Request.getRestParam(req, 'surveyId')

      const record = req.body

      if (Record.getOwnerId(record) !== user.id) {
        sendErr(res, 'Error record create. User is different')
        return
      }

      await RecordService.createRecord(user, surveyId, record)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/record/:recordUuid/node', requireRecordEditPermission, async (req, res) => {
    try {
      const user = req.user
      const node = JSON.parse(req.body.node)
      const file = Request.getFile(req)

      const surveyId = Request.getRestParam(req, 'surveyId')

      await RecordService.persistNode(user, surveyId, node, file)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  app.get('/survey/:surveyId/records/count', requireRecordListViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')

      const count = await RecordService.countRecordsBySurveyId(surveyId)
      res.json(count)

    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/records', requireRecordListViewPermission, async (req, res) => {
    try {
      const { surveyId, limit, offset } = Request.getParams(req)

      const recordsSummary = await RecordService.fetchRecordsSummaryBySurveyId(surveyId, offset, limit)
      res.json(recordsSummary)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/record/:recordUuid/nodes/:nodeUuid/file', requireRecordViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const nodeUuid = Request.getRestParam(req, 'nodeUuid')

      const node = await RecordService.fetchNodeByUuid(surveyId, nodeUuid)
      //TODO use fileService
      const file = await FileManager.fetchFileByUuid(surveyId, Node.getNodeFileUuid(node))

      sendFile(res, RecordFile.getName(file), RecordFile.getContent(file), RecordFile.getSize(file))
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  // RECORD promote / demote
  app.post('/survey/:surveyId/record/:recordUuid/step', requireRecordEditPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const recordUuid = Request.getRestParam(req, 'recordUuid')
      const step = req.body.step

      await RecordService.updateRecordStep(surveyId, recordUuid, step)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // RECORD Check in / out
  app.post('/survey/:surveyId/record/:recordUuid/checkin', requireRecordViewPermission, async (req, res) => {
    try {
      const user = req.user
      const surveyId = Request.getRestParam(req, 'surveyId')
      const recordUuid = Request.getRestParam(req, 'recordUuid')

      const record = await RecordService.checkIn(user, surveyId, recordUuid)

      res.json({ record })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/record/:recordUuid/checkout', async (req, res) => {
    try {
      const user = req.user
      const surveyId = Request.getRestParam(req, 'surveyId')
      const recordUuid = Request.getRestParam(req, 'recordUuid')

      await RecordService.checkOut(user, surveyId, recordUuid)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE
  app.delete('/survey/:surveyId/record/:recordUuid', requireRecordEditPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const recordUuid = Request.getRestParam(req, 'recordUuid')
      const user = req.user

      await RecordService.deleteRecord(user, surveyId, recordUuid)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/record/:recordUuid/node/:nodeUuid', requireRecordEditPermission, async (req, res) => {
    try {
      const nodeUuid = Request.getRestParam(req, 'nodeUuid')
      const user = req.user

      RecordService.deleteNode(user, nodeUuid)
      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}
