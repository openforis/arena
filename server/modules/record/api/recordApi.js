const R = require('ramda')

const { getRestParam } = require('../../../serverUtils/request')
const { sendErr, sendOk, sendFile } = require('../../../serverUtils/response')

const Node = require('../../../../common/record/node')
const RecordFile = require('../../../../common/record/recordFile')

// const RecordManager = require('../../recordManager')
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
      const surveyId = getRestParam(req, 'surveyId')

      const record = req.body

      if (record.ownerId !== user.id) {
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
      const file = R.path(['files', 'file'])(req)

      const surveyId = getRestParam(req, 'surveyId')

      RecordManager.persistNode(user, surveyId, node, file)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  app.get('/survey/:surveyId/records/count', requireRecordListViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')

      const count = await RecordManager.countRecordsBySurveyId(surveyId)
      res.json(count)

    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/records', requireRecordListViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const limit = getRestParam(req, 'limit')
      const offset = getRestParam(req, 'offset')

      const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId(surveyId, offset, limit)
      res.json(recordsSummary)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/record/:recordUuid/nodes/:nodeUuid/file', requireRecordViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const nodeUuid = getRestParam(req, 'nodeUuid')

      const node = await RecordManager.fetchNodeByUuid(surveyId, nodeUuid)
      const file = await FileManager.fetchFileByUuid(surveyId, R.prop('fileUuid', Node.getNodeValue(node)))

      sendFile(res, RecordFile.getName(file), RecordFile.getContent(file), RecordFile.getSize(file))
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  // RECORD promote / demote
  app.post('/survey/:surveyId/record/:recordUuid/step', requireRecordEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const recordUuid = getRestParam(req, 'recordUuid')
      const step = req.body.step

      await RecordManager.updateRecordStep(surveyId, recordUuid, step)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // RECORD Check in / out
  app.post('/survey/:surveyId/record/:recordUuid/checkin', requireRecordViewPermission, async (req, res) => {
    try {
      const user = req.user
      const surveyId = getRestParam(req, 'surveyId')
      const recordUuid = getRestParam(req, 'recordUuid')

      const record = await RecordManager.checkInRecord(user, surveyId, recordUuid)

      res.json({ record })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/record/:recordUuid/checkout', async (req, res) => {
    try {
      const user = req.user
      const surveyId = getRestParam(req, 'surveyId')
      const recordUuid = getRestParam(req, 'recordUuid')

      await RecordManager.checkOutRecord(user, surveyId, recordUuid)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE
  app.delete('/survey/:surveyId/record/:recordUuid', requireRecordEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const recordUuid = getRestParam(req, 'recordUuid')
      const user = req.user

      await RecordManager.deleteRecord(user, surveyId, recordUuid)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/record/:recordUuid/node/:nodeUuid', requireRecordEditPermission, async (req, res) => {
    try {
      const nodeUuid = getRestParam(req, 'nodeUuid')
      const user = req.user

      const nodes = await RecordManager.deleteNode(user, nodeUuid)
      res.json({ nodes })
    } catch (err) {
      sendErr(res, err)
    }
  })

}
