import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { db } from '@server/db/db'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

class CalculationBuilder {
  constructor(nodeDefName) {
    this._nodeDefName = nodeDefName
    this._aggregateFn = null
    this._formula = null
  }

  build(survey, step) {
    const nodeDef = Survey.getNodeDefByName(this._nodeDefName)(survey)
    return ProcessingChain.newProcessingStepCalculation(step, NodeDef.getUuid(nodeDef), {
      [ProcessingStepCalculation.keysProps.type]: ProcessingStepCalculation.getTypeByNodeDef(nodeDef),
      [ProcessingStepCalculation.keysProps.aggregateFn]: this._aggregateFn,
      [ProcessingStepCalculation.keysProps.formula]: this._formula,
    })
  }

  aggregateFn(fn) {
    this._aggregateFn = fn
    return this
  }

  formula(formula) {
    this._formula = formula
    return this
  }
}

class StepBuilder {
  constructor(entityName, ...calculationBuilders) {
    this.entityName = entityName
    this.calculationBuilders = calculationBuilders
  }

  build(survey, chain) {
    const step = ProcessingChain.newProcessingStep(chain, {
      [ProcessingStep.keysProps.entityUuid]: NodeDef.getUuid(Survey.getNodeDefByName(this.entityName)(survey)),
    })
    const calculations = this.calculationBuilders.map(builder => builder.build(survey, step))
    return ProcessingStep.assocCalculations(calculations)(step)
  }
}

class ChainBuilder {
  constructor(user, survey, label, ...stepBuilders) {
    this.survey = survey
    this.user = user
    this.label = label
    this.stepBuilders = stepBuilders
  }

  build() {
    const chain = ProcessingChain.newProcessingChain({ [ProcessingChain.keysProps.labels]: { en: this.label } })
    const steps = this.stepBuilders.map(builder => builder.build(this.survey, chain))
    return ProcessingChain.assocProcessingSteps(steps)(chain)
  }

  async buildAndStore(client = db) {
    const { user, survey } = this
    return await client.tx(async t => {
      const chain = this.build()
      const surveyId = Survey.getId(survey)
      const steps = ProcessingChain.getProcessingSteps(chain)
      if (R.isEmpty(steps)) {
        const chainLabel = ProcessingChain.getLabel(Survey.getDefaultLanguage(survey))(chain)
        throw new Error(`Cannot persist processing chain ${chainLabel}: empty steps`)
      }

      for (const step of steps) {
        const calculations = ProcessingStep.getCalculations(step)
        if (R.isEmpty(calculations)) {
          throw new Error(`Cannot persist processing step #${ProcessingStep.getIndex(step)}: empty calculations`)
        }

        for (const calculation of calculations) {
          await ProcessingChainManager.updateChain(user, surveyId, chain, step, calculation, t)
        }
      }
    })
  }
}

export const chain = (user, survey, label, stepBuilders) => new ChainBuilder(user, survey, label, stepBuilders)
export const step = (entityName, calculationBuilders) => new StepBuilder(entityName, calculationBuilders)
export const calculation = (type, nodeDefName, aggregateFn) => new CalculationBuilder(type, nodeDefName, aggregateFn)
