import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'
import { arenaPersistCalculationScript } from '@server/modules/analysis/service/_rChain/rFunctions'

export default class RFilePersistScripts extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'persist-scripts')
  }

  async init() {
    await super.init()

    const schemaSurvey = getSurveyDBSchema(this.rChain.surveyId)

    const rSteps = this.rChain.rSteps
    for (const rStep of rSteps) {
      const rCalculations = rStep.rCalculations
      const persistCalculations = rCalculations.map(rCalculation =>
        arenaPersistCalculationScript(
          rCalculation.rFile.pathRelative,
          schemaSurvey,
          ProcessingStepCalculation.getUuid(rCalculation.calculation),
        ),
      )
      await this.appendContent(...persistCalculations)
    }

    return this
  }
}
