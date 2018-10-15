const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')

const {createRecord, persistNode, deleteNode} = require('./recordManager')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/record', async (req, res) => {
    try {
      const {user} = req
      const recordReq = req.body

      if (recordReq.ownerId !== user.id) {
        throw new Error('Error record create. User is different')
      }

      const record = await createRecord(recordReq)

      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/record/:recordId/node', async (req, res) => {
    try {
      const nodeReq = req.body

      // const nodeDef = await fetchNodeDef(nodeReq.nodeDefId)
      const surveyId = getRestParam(req, 'surveyId')
      const nodes = await persistNode(surveyId, nodeReq)

      res.json({nodes})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ
  // app.get('/survey/:surveyId/record/:recordId', async (req, res) => {
  //   try {
  //     const surveyId = getRestParam(req, 'surveyId')
  //     const recordId = getRestParam(req, 'recordId')
  //
  //     const record = await fetchRecordById(surveyId, recordId)
  //     res.json({record})
  //   } catch (err) {
  //     sendErr(res, err)
  //   }
  // })
  //

  // ==== UPDATE


  // ==== DELETE

  app.delete('/survey/:surveyId/record/:recordId/node/:nodeUUID', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const nodeUUID = getRestParam(req, 'nodeUUID')

      const nodes = await deleteNode(surveyId, nodeUUID)
      res.json({nodes})
    } catch (err) {
      sendErr(res, err)
    }
  })
}