const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')
const {fetchRecordById} = require('../record/recordRepository')
const {processCommand} = require('./recordUpdater')
const {commandType} = require('../../common/record/record')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/record', async (req, res) => {
    const {user} = req
    const surveyId = getRestParam(req, 'surveyId')
    try {
      const command = {
        type: commandType.createRecord,
        surveyId,
        user
      }
      const record = await processCommand(command)

      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ
  app.get('/survey/:surveyId/record/:recordId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const recordId = getRestParam(req, 'recordId')

      const record = await fetchRecordById(surveyId, recordId)
      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE
  app.put('/survey/:surveyId/record/:recordId/node/:nodeId', async (req, res) => {
    try {
      const {user, body} = req

      const surveyId = getRestParam(req, 'surveyId')
      const recordId = getRestParam(req, 'recordId')

      const command = {
        ...body.command,
        surveyId,
        recordId,
        user
      }
      const updatedNodes = await processCommand(command)
      res.json({updatedNodes})
    } catch (err) {
      sendErr(res, err)
    }
  })

}