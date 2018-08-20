const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')
const {fetchRecordById} = require('../record/recordRepository')
const {CommandProcessor} = require('./commandProcessor')
const {commandType, eventType} = require('../../common/record/record')
const {insertRecordCreatedLog, insertNodeAddedLog, insertNodeUpdatedLog, insertNodeDeletedLog} = require('../record/recordLogRepository')

const commandProcessor = new CommandProcessor()

//register record update log listeners
commandProcessor.on(eventType.recordCreated, async ({surveyId, user, record}) => {
  await insertRecordCreatedLog(surveyId, user, record)
})
commandProcessor.on(eventType.nodeAdded, async ({surveyId, user, node}) => {
  await insertNodeAddedLog(surveyId, user, node)
})
commandProcessor.on(eventType.nodeUpdated, async ({surveyId, user, node}) => {
  await insertNodeUpdatedLog(surveyId, user, node)
})
commandProcessor.on(eventType.nodeDeleted, async ({surveyId, user, node}) => {
  await insertNodeDeletedLog(surveyId, user, node)
})

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
      const events = await commandProcessor.processCommand(command)

      res.json({events})
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
  app.put('/survey/:surveyId/record/:recordId/update', async (req, res) => {
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
      const events = await commandProcessor.processCommand(command)
      res.json({events})
    } catch (err) {
      sendErr(res, err)
    }
  })

}