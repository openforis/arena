// eslint-disable-next-line max-classes-per-file
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ChainFactory from '@common/analysis/chainFactory'
import * as ChainController from '@common/analysis/chainController'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import * as DB from '@server/db'
import * as AnalysisManager from '@server/modules/analysis/manager'

class CalculationBuilder {
  constructor(nodeDefName, label) {
    this._nodeDefName = nodeDefName
    this._label = label
    this._aggregateFn = null
    this._formula = null
  }

  build({ survey, chain, step }) {
    const nodeDef = Survey.getNodeDefByName(this._nodeDefName)(survey)
    const defaultLang = R.pipe(Survey.getSurveyInfo, Survey.getDefaultLanguage)(survey)
    const calculation = ChainFactory.createCalculation({
      step,
      nodeDefUuid: NodeDef.getUuid(nodeDef),
      props: {
        [Calculation.keysProps.labels]: { [defaultLang]: this._label },
        [Calculation.keysProps.type]: Calculation.getTypeByNodeDef(nodeDef),
        [Calculation.keysProps.aggregateFn]: this._aggregateFn,
        [Calculation.keysProps.formula]: this._formula,
      },
    })
    return ChainController.assocCalculation({ chain, step, calculation })
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
    const step = ChainFactory.createStep({
      chain,
      props: {
        [Step.keysProps.entityUuid]: NodeDef.getUuid(Survey.getNodeDefByName(this.entityName)(survey)),
      },
    })
    return this.calculationBuilders.reduce((stepUpdated, calculationBuilder) => {
      const { step: stepWithCalculation } = calculationBuilder.build({ survey, chain, step: stepUpdated })
      return stepWithCalculation
    }, step)
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
    const defaultLang = R.pipe(Survey.getSurveyInfo, Survey.getDefaultLanguage)(this.survey)
    const chain = ChainFactory.createChain({
      props: { [Chain.keysProps.labels]: { [defaultLang]: this.label } },
    })
    const steps = this.stepBuilders.map((builder) => builder.build(this.survey, chain))
    return ChainController.assocSteps({ chain, steps })
  }

  async buildAndStore(client = DB.client) {
    const { user, survey } = this
    // eslint-disable-next-line no-return-await
    return await client.tx(async (t) => {
      const { chain } = this.build()
      const surveyId = Survey.getId(survey)
      const steps = Chain.getProcessingSteps(chain)
      if (R.isEmpty(steps)) {
        const defaultLang = R.pipe(Survey.getSurveyInfo, Survey.getDefaultLanguage)(survey)
        const chainLabel = Chain.getLabel(defaultLang)(chain)
        throw new Error(`Cannot persist processing chain ${chainLabel}: empty steps`)
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const step of steps) {
        const calculations = Step.getCalculations(step)
        if (R.isEmpty(calculations)) {
          throw new Error(`Cannot persist processing step #${Step.getIndex(step)}: empty calculations`)
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const calculation of calculations) {
          // eslint-disable-next-line no-await-in-loop
          await AnalysisManager.persistAll({ user, surveyId, chain, step, calculation }, t)
        }
      }
    })
  }
}

export const chain = (user, survey, label, stepBuilders) => new ChainBuilder(user, survey, label, stepBuilders)
export const step = (entityName, calculationBuilders) => new StepBuilder(entityName, calculationBuilders)
export const calculation = (type, label) => new CalculationBuilder(type, label)
