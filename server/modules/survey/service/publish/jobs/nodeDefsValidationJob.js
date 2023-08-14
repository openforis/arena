import * as R from 'ramda'

import { Promises } from '@openforis/arena-core'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '../../../manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'

const getNodeDefPath = ({ survey, nodeDef }) => {
  if (NodeDef.isRoot(nodeDef)) {
    return NodeDef.getName(nodeDef)
  }
  const pathParts = []
  Survey.visitAncestorsAndSelf(nodeDef, (ancestor) => {
    if (!NodeDef.isRoot(ancestor)) {
      pathParts.unshift(NodeDef.getName(ancestor))
    }
  })(survey)
  return pathParts.join('/')
}

export default class NodeDefsValidationJob extends Job {
  constructor(params) {
    super(NodeDefsValidationJob.type, params)
  }

  async execute() {
    const { errors, surveyId, tx } = this

    await NodeDefManager.deleteOrphaneNodeDefs(surveyId, tx)

    const surveySummary = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, tx)
    const cycleKeys = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(surveySummary)

    await Promises.each(cycleKeys, async (cycle) => {
      const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        {
          surveyId,
          cycle,
          draft: true,
          advanced: true,
          validate: true,
        },
        tx
      )

      R.pipe(
        Survey.getNodeDefsValidation,
        Validation.getFieldValidations,
        R.forEachObjIndexed((nodeDefValidation, nodeDefUuid) => {
          const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
          errors[getNodeDefPath({ survey, nodeDef })] = Validation.getFieldValidations(nodeDefValidation)
        })
      )(survey)
    })

    if (!R.isEmpty(errors)) {
      await this.setStatusFailed()
    }
  }
}

NodeDefsValidationJob.type = 'NodeDefsValidationJob'
