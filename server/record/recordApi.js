const R = require('ramda')

const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')

const RecordManager = require('./recordManager')
const Node = require('../../common/record/node')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/record', async (req, res) => {
    try {
      const {user} = req
      const recordReq = req.body

      if (recordReq.ownerId !== user.id) {
        throw new Error('Error record create. User is different')
      }

      const record = await RecordManager.createRecord(recordReq)

      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/record/:recordId/node', async (req, res) => {
    try {
      const node = JSON.parse(req.body.node)
      const file = R.path(['files', 'file'])(req)

      const surveyId = getRestParam(req, 'surveyId')
      const nodes = await RecordManager.persistNode(surveyId, node, file)

      res.json({nodes})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  app.get('/survey/:surveyId/records/count', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')

      const count = await RecordManager.countRecordsBySurveyId(surveyId)
      res.json(count)

    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/records', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const limit = getRestParam(req, 'limit')
      const offset = getRestParam(req, 'offset')

      const records = await RecordManager.fetchRecordsSummaryBySurveyId(surveyId, offset, limit)
      res.json({records})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/record/:recordId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const recordId = getRestParam(req, 'recordId')

      const record = await RecordManager.fetchRecordById(surveyId, recordId)
      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/record/:recordId/nodes/:nodeUUID/file', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const nodeUUID = getRestParam(req, 'nodeUUID')

      const node = await RecordManager.fetchNodeFileByUUID(surveyId, nodeUUID)
      const value = Node.getNodeValue(node)

      res.setHeader('Content-disposition', `attachment; filename=${value.fileName}`)
      // res.set('Content-Type', 'text/csv')

      res.write(node.file, 'binary')
      res.end(null, 'binary')
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  // ==== DELETE

  app.delete('/survey/:surveyId/record/:recordId/node/:nodeUUID', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const nodeUUID = getRestParam(req, 'nodeUUID')

      const nodes = await RecordManager.deleteNode(surveyId, nodeUUID)
      res.json({nodes})
    } catch (err) {
      sendErr(res, err)
    }
  })
}
