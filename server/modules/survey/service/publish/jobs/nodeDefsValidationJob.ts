import * as R from 'ramda'

import Job from '../../../../../job/job'

import Survey from '../../../../../../core/survey/survey'
import NodeDef from '../../../../../../core/survey/nodeDef'
import Validation from '../../../../../../core/validation/validation'

import SurveyManager from '../../../../survey/manager/surveyManager'

export default class NodeDefsValidationJob extends Job {
  static type: string = 'NodeDefsValidationJob'

  constructor (params?) {
    super(NodeDefsValidationJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, false, tx)
    const cycleKeys = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)
    for (const cycle of cycleKeys) {
      const surveyAndNodeDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, cycle, true, true, true, false, tx)

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
