import * as R from 'ramda'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n, useNodeDefByUuid, useSurvey, useSurveyInfo } from '@webapp/commonComponents/hooks'
import { useChainEdit } from '@webapp/loggedin/modules/analysis/hooks'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'

import { validateCalculation } from '@webapp/loggedin/modules/analysis/calculation/actions'

const getTypes = (i18n) =>
  R.pipe(
    R.keys,
    R.map((type) => ({
      key: type,
      label: i18n.t(`processingStepCalculationView.types.${type}`),
    }))
  )(Calculation.type)

const getAggregateFns = (i18n) =>
  R.pipe(
    R.keys,
    R.map((fn) => ({
      key: fn,
      label: i18n.t(`processingStepCalculationView.aggregateFunctions.${fn}`),
    }))
  )(Calculation.aggregateFn)

export default () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const survey = useSurvey()
  const surveyInfo = useSurveyInfo()
  const { chain, step, calculation, calculationDirty, editingCalculation } = useChainEdit()
  const attributeDefUuidsOtherChains = useSelector(ChainState.getAttributeUuidsOtherChains)
  const stepPrevCalculationAttributeUuids = useSelector(StepState.getStepPrevCalculationAttributeUuids)
  const entity = useNodeDefByUuid(Step.getEntityUuid(step))
  const attribute = useNodeDefByUuid(Calculation.getNodeDefUuid(calculation))
  const attributesPrevStep = Survey.getNodeDefsByUuids(stepPrevCalculationAttributeUuids)(survey)

  const attributes = R.pipe(
    Survey.getNodeDefChildren(entity, true),
    R.concat(attributesPrevStep),
    R.uniq,
    // Node def is analysis and type is compatible with processing step type (quantitative/categorical)
    R.filter(
      (nodeDef) =>
        NodeDef.isAnalysis(nodeDef) &&
        NodeDef.getType(nodeDef) === Calculation.getNodeDefType(calculation) &&
        !R.includes(NodeDef.getUuid(nodeDef), attributeDefUuidsOtherChains)
    )
  )(survey)

  const calculationUuid = Calculation.getUuid(calculation)
  const validation = Chain.getItemValidationByUuid(calculationUuid)(chain)
  const aggregateFunctionEnabled =
    Calculation.isQuantitative(calculation) && (Step.getIndex(step) > 0 || NodeDef.isVirtual(entity))

  useEffect(() => {
    if (!R.isEmpty(calculation)) {
      dispatch(validateCalculation())
    }
  }, [])

  return {
    i18n,
    surveyInfo,
    calculation,
    editingCalculation,
    validation,
    calculationDirty,
    attributes,
    attribute,
    types: getTypes(i18n),
    aggregateFunctionEnabled,
    aggregateFns: aggregateFunctionEnabled ? getAggregateFns(i18n) : null,
  }
}
