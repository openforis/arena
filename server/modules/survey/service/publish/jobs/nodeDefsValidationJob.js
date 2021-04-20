import * as R from 'ramda'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '../../../manager/surveyManager'

export default class NodeDefsValidationJob extends Job {
  constructor(params) {
    super(NodeDefsValidationJob.type, params)
  }

  async execute() {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, false, this.tx)
    const cycleKeys = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)
    for (const cycle of cycleKeys) {
      const surveyAndNodeDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        {
          surveyId: this.surveyId,
          cycle,
          draft: true,
          advanced: true,
          validate: true,
        },
        this.tx
      )

      R.pipe(
        Survey.getNodeDefsValidation,
        Validation.getFieldValidations,
        R.forEachObjIndexed((nodeDefValidation, nodeDefUuid) => {
          const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(surveyAndNodeDefs)
          this.errors[NodeDef.getName(nodeDef)] = Validation.getFieldValidations(nodeDefValidation)
        })
      )(surveyAndNodeDefs)
    }

    if (!R.isEmpty(this.errors)) {
      await this.setStatusFailed()
    }
  }
}

NodeDefsValidationJob.type = 'NodeDefsValidationJob'
