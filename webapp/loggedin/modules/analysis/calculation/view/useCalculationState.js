import * as R from 'ramda'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyInfo, useNodeDefByUuid } from '@webapp/store/survey'
import { useChainEdit } from '@webapp/loggedin/modules/analysis/hooks'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { validateCalculation } from '@webapp/loggedin/modules/analysis/calculation/actions'

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

export default () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const survey = useSurvey()
  const surveyInfo = useSurveyInfo()
  const { chain, step, calculation, calculationDirty, editingCalculation } = useChainEdit()

  const entity = useNodeDefByUuid(Step.getEntityUuid(step))
  const attribute = useNodeDefByUuid(Calculation.getNodeDefUuid(calculation))
  const attributeUuidsOtherChains = useSelector(ChainState.getAttributeUuidsOtherChains)
  const attributeUuidsOtherCalculations = Step.getCalculations(step)
    .filter((c) => !Calculation.isEqual(c)(calculation))
    .map(Calculation.getNodeDefUuid)
  const children = Survey.getNodeDefChildren(entity, true)(survey)
  const attributes = children.filter(
    (nodeDef) =>
      NodeDef.isAnalysis(nodeDef) && // // Node def must be analysis
      NodeDef.getType(nodeDef) === Calculation.getNodeDefType(calculation) && // And type is compatible with processing step type (quantitative/categorical)
      !R.includes(NodeDef.getUuid(nodeDef), attributeUuidsOtherChains) && // And must not be used by other chains
      !R.includes(NodeDef.getUuid(nodeDef), attributeUuidsOtherCalculations) // And must not be used by other calculations
  )

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
