import React, { useEffect, useState } from 'react'
import * as R from 'ramda'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { validateProcessingStepCalculation } from './actions'

const getTypes = i18n =>
  R.pipe(
    R.keys,
    R.map(type => ({
      key: type,
      label: i18n.t(`processingStepCalculationView.types.${type}`),
    })),
  )(ProcessingStepCalculation.type)

const getAggregateFns = i18n =>
  R.pipe(
    R.keys,
    R.map(fn => ({
      key: fn,
      label: i18n.t(`processingStepCalculationView.aggregateFunctions.${fn}`),
    })),
  )(ProcessingStepCalculation.aggregateFn)

export default () => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!R.isEmpty(calculation)) {
      dispatch(validateProcessingStepCalculation())
    }
  }, [])

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Get survey info, calculation and attributes from store
  const survey = useSelector(SurveyState.getSurvey)
  const processingChain = useSelector(ProcessingChainState.getProcessingChain)
  const processingStep = useSelector(ProcessingStepState.getProcessingStep)
  const calculation = useSelector(ProcessingStepCalculationState.getCalculation)
  const dirty = useSelector(ProcessingStepCalculationState.isDirty)

  const entityDefUuid = ProcessingStep.getEntityUuid(processingStep)
  const attributes = entityDefUuid
    ? R.pipe(
        Survey.getNodeDefByUuid(entityDefUuid),
        entityDef => Survey.getNodeDefChildren(entityDef, true)(survey),
        R.filter(nodeDef =>
          // Node def type is compatible with processing step type (quantitative/categorical)
          R.pipe(NodeDef.getType, R.equals(ProcessingStepCalculation.getNodeDefType(calculation)))(nodeDef),
        ),
      )(survey)
    : []

  const attribute = R.pipe(ProcessingStepCalculation.getNodeDefUuid, nodeDefUuid =>
    Survey.getNodeDefByUuid(nodeDefUuid)(survey),
  )(calculation)

  return {
    i18n,

    surveyInfo: Survey.getSurveyInfo(survey),
    calculation,
    validation: ProcessingChain.getItemValidationByUuid(ProcessingStepCalculation.getUuid(calculation))(
      processingChain,
    ),
    dirty,
    attributes,
    attribute,

    types: getTypes(i18n),
    aggregateFns: getAggregateFns(i18n),

    showCancelConfirm,
    setShowCancelConfirm,
  }
}
