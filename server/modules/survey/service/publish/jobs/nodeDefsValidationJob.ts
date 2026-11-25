import type { ArenaAnyNodeDef, ArenaSurvey } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import Job, { type JobParams } from '@server/job/job'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyManager from '../../../manager/surveyManager'

const getNodeDefPath = ({ survey, nodeDef }: { survey: ArenaSurvey; nodeDef: ArenaAnyNodeDef }) => {
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
  static readonly type: string = 'NodeDefsValidationJob'

  constructor(params?: Partial<JobParams>) {
    super(NodeDefsValidationJob.type, params)
  }

  async execute() {
    const { errors, surveyId, tx } = this

    // fetch survey (published) as it is before starting publishing
    const surveyPublishedPrevious = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
      { surveyId, advanced: true, includeAnalysis: true },
      tx
    )
    this.setContext({ surveyPublishedPrevious })

    await NodeDefManager.deleteOrphaneNodeDefs(surveyId, tx)

    const surveySummary = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, tx)
    const cycleKeys = A.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(surveySummary)

    for (const cycle of cycleKeys) {
      const survey = /* NOSONAR */ await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        { surveyId, cycle, draft: true, advanced: true, validate: true },
        tx
      )

      A.pipe(
        Survey.getNodeDefsValidation,
        Validation.getFieldValidations,
        A.forEachObjIndexed((nodeDefValidation, nodeDefUuid) => {
          const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
          errors[getNodeDefPath({ survey, nodeDef })] = Validation.getFieldValidations(nodeDefValidation)
        })
      )(survey)
    }

    if (!A.isEmpty(errors)) {
      await this.setStatusFailed()
    }
  }
}
