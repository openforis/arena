import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useNodeDefByUuid } from '@webapp/store/survey'
import { State } from '../../store'

const getTypes = (i18n) =>
  R.pipe(
    R.keys,
    R.map((type) => ({
      key: type,
      label: i18n.t(`processingStepCalculation.types.${type}`),
    }))
  )(Calculation.type)

const getAggregateFns = (i18n) =>
  R.pipe(
    R.keys,
    R.map((fn) => ({
      key: fn,
      label: i18n.t(`processingStepCalculation.aggregateFunctions.${fn}`),
    }))
  )(Calculation.aggregateFn)

export default ({ state }) => {
  const i18n = useI18n()
  const survey = useSurvey()

  const attributesUuidsOtherChains = State.getAttributeUuidsOtherChains(state)
  const chain = State.getChainEdit(state)
  const step = State.getStepEdit(state)
  const calculation = State.getCalculationEdit(state)

  const entity = useNodeDefByUuid(Step.getEntityUuid(step))
  const attribute = useNodeDefByUuid(Calculation.getNodeDefUuid(calculation))

  const attributeUuidsOtherCalculations = Step.getCalculations(step)
    .filter((c) => !Calculation.isEqual(c)(calculation))
    .map(Calculation.getNodeDefUuid)
  const children = Survey.getNodeDefChildren(entity, true)(survey)
  const attributes = children.filter(
    (nodeDef) =>
      NodeDef.isAnalysis(nodeDef) && // // Node def must be analysis
      NodeDef.getType(nodeDef) === Calculation.getNodeDefType(calculation) && // And type is compatible with processing step type (quantitative/categorical)
      !R.includes(NodeDef.getUuid(nodeDef), attributesUuidsOtherChains) && // And must not be used by other chains
      !R.includes(NodeDef.getUuid(nodeDef), attributeUuidsOtherCalculations) // And must not be used by other calculations
  )

  const calculationUuid = Calculation.getUuid(calculation)
  const validation = Chain.getItemValidationByUuid(calculationUuid)(chain)
  const aggregateFunctionEnabled =
    Calculation.isQuantitative(calculation) && (!Step.getIndex(step) > 0 || NodeDef.isVirtual(entity))

  return {
    validation,
    attributes,
    attribute,
    types: getTypes(i18n),
    aggregateFunctionEnabled,
    aggregateFns: aggregateFunctionEnabled ? getAggregateFns(i18n) : null,
  }
}
