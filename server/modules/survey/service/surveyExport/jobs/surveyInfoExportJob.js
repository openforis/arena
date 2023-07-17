import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as SurveyCycle from '@core/survey/surveyCycle'
import * as NodeDef from '@core/survey/nodeDef'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { ExportFile } from '../exportFile'

const keepOnlyOneCycle = ({ survey, cycle }) => {
  // keep only first cycle in survey cycles
  survey[Survey.infoKeys.cycles] = {
    [Survey.cycleOneKey]: SurveyCycle.newCycle(),
  }
  // move layout in spefified cycle into first cycle
  Survey.getNodeDefsArray(survey).forEach((nodeDef) => {
    NodeDef.keepOnlyOneCycle({ cycleToKeep: cycle, cycleTarget: Survey.cycleOneKey })(nodeDef)
  })
  return survey
}

export default class SurveyInfoExportJob extends Job {
  constructor(params) {
    super('SurveyInfoExportJob', params)
  }

  async execute() {
    const { archive, backup, surveyId, cycle = null } = this.context

    // fetch survey with combined props and propsDraft to get proper survey info
    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, this.tx)

    // fetch survey with props and propsDraft not combined together to get a full export
    let surveyFull = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
      { surveyId, advanced: true, backup, draft: true, cycle },
      this.tx
    )
    if (!Objects.isEmpty(cycle)) {
      surveyFull = keepOnlyOneCycle({ survey: surveyFull, cycle })
    }
    archive.append(JSON.stringify(surveyFull, null, 2), { name: ExportFile.survey })

    this.setContext({ survey })
  }
}
