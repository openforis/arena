import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import RFileSystem from './rFileSystem'
import { arenaPersistCalculationScript } from '../../rFunctions'

export default class RFilePersistScripts extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'persist-scripts')
  }

  async init() {
    await super.init()

    const schemaSurvey = getSurveyDBSchema(this.rChain.surveyId)

    await Promise.all(
      this.rChain.rSteps.map(async (rStep) => {
        const persistCalculations = rStep.rCalculations.map((rCalculation) =>
          arenaPersistCalculationScript(
            rCalculation.rFile.pathRelative,
            schemaSurvey,
            ProcessingStepCalculation.getUuid(rCalculation.calculation)
          )
        )
        await this.appendContent(...persistCalculations)
      })
    )

    return this
  }
}
