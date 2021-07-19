import * as R from 'ramda'

import * as Request from '@server/utils/request'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as AuthMiddleware from '../../auth/authApiMiddleware'

import * as SurveyService from '../../survey/service/surveyService'
import * as NodeDefService from '../service/nodeDefService'

const sendRespNodeDefsAndValidation = async (
  res,
  surveyId,
  cycle,
  sendNodeDefs = false,
  draft = true,
  advanced = true,
  validate = true,
  nodeDefsUpdated = null
) => {
  const survey = await SurveyService.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft, advanced, validate })

  res.json({
    nodeDefs: sendNodeDefs ? Survey.getNodeDefs(survey) : null,
    nodeDefsValidation: Survey.getNodeDefsValidation(survey),
    nodeDefsUpdated,
  })
}

export const init = (app) => {
  // ==== CREATE

  app.post('/survey/:surveyId/nodeDef', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId } = Request.getParams(req)
      const { surveyCycleKey, nodeDef } = Request.getBody(req)

      const { nodeDefsUpdated, nodeDefsValidation } = await NodeDefService.insertNodeDef({
        user,
        surveyId,
        cycle: surveyCycleKey,
        nodeDef,
      })
      res.json({ nodeDefsUpdated: R.dissoc(NodeDef.getUuid(nodeDef), nodeDefsUpdated), nodeDefsValidation })
    } catch (error) {
      next(error)
    }
  })

  // ==== READ

  app.get('/survey/:surveyId/nodeDefs', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, draft, validate } = Request.getParams(req)
      const advanced = true // Always fetch advanced props (TODO fetch only what is needed- now in dataentry min/max count are needed)
      const sendNodeDefs = true

      await sendRespNodeDefsAndValidation(res, surveyId, cycle, sendNodeDefs, draft, advanced, validate)
    } catch (error) {
      next(error)
    }
  })

  // ==== UPDATE

  app.put(
    '/survey/:surveyId/nodeDef/:nodeDefUuid/props',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { props, propsAdvanced } = Request.getBody(req)
        const { surveyId, cycle, nodeDefUuid, parentUuid } = Request.getParams(req)

        const { nodeDefsUpdated, nodeDefsValidation } = await NodeDefService.updateNodeDefProps({
          user,
          surveyId,
          cycle,
          nodeDefUuid,
          parentUuid,
          props,
          propsAdvanced,
        })

        // do not send updated node def back to client (node def already updated client side)
        delete nodeDefsUpdated[nodeDefUuid]
        res.json({ nodeDefsUpdated, nodeDefsValidation })
      } catch (error) {
        next(error)
      }
    }
  )

  // ==== DELETE

  app.delete(
    '/survey/:surveyId/nodeDef/:nodeDefUuid',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, surveyCycleKey: cycle, nodeDefUuid } = Request.getParams(req)

        const { nodeDefsUpdated, nodeDefsValidation } = await NodeDefService.markNodeDefDeleted({
          user,
          surveyId,
          cycle,
          nodeDefUuid,
        })

        // do not send updated node def back to client (node def already updated client side)
        delete nodeDefsUpdated[nodeDefUuid]
        res.json({ nodeDefsUpdated, nodeDefsValidation })
      } catch (error) {
        next(error)
      }
    }
  )
}
