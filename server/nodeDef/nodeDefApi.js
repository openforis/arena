const {sendErr, sendOk} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {
  createNodeDef,
  updateNodeDefProp,
  markNodeDefDeleted,
} = require('./nodeDefManager')

const {fetchSurveyNodeDefs} = require('./../survey/surveyManager')
const {canEditSurvey} = require('../authGroup/authGroupManager')

module.exports.init = app => {

  // ==== CREATE

  app.post('/nodeDef', async (req, res) => {
    try {
      const {body: nodeDefRequest, user} = req
      const {surveyId, parentId, uuid, type, props} = nodeDefRequest

      // Check permissions
      console.log('canEditSurvey:', await canEditSurvey(user.id, surveyId))

      const nodeDef = await createNodeDef(surveyId, parentId, uuid, type, props)

      res.json({nodeDef})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  // ==== UPDATE

  app.put('/nodeDef/:id/prop', async (req, res) => {
    try {
      const {body} = req
      const {key, value} = body
      const nodeDefId = getRestParam(req, 'id')

      const nodeDef = await updateNodeDefProp(nodeDefId, key, value)
      const nodeDefs = await fetchSurveyNodeDefs(nodeDef.surveyId, true, true)

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/nodeDef/:id', async (req, res) => {
    try {
      const nodeDefId = getRestParam(req, 'id')

      await markNodeDefDeleted(nodeDefId)

      sendOk(res)
    } catch (e) {
      sendErr(res, e)
    }
  })
}
