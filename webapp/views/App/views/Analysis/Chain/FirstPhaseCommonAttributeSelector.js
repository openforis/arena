import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { SurveyState } from '@webapp/store/survey'

import { BaseUnitCodeAttributeSelector } from './BaseUnitCodeAttributeSelector'
import { Objects } from '@openforis/arena-core'

export const FirstPhaseCommonAttributeSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)
  const firstPhaseCategoryUuid = ChainSamplingDesign.getFirstPhaseCategoryUuid(samplingDesign)

  const firstPhaseCategoryExtraDefNames = useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const firstPhaseCategory = Survey.getCategoryByUuid(firstPhaseCategoryUuid)(survey)
    if (!firstPhaseCategory) return []
    const extraDefs = Category.getItemExtraDefsArray(firstPhaseCategory)
    return extraDefs.map(ExtraPropDef.getName)
  }, Objects.isEqual)

  const onChange = useCallback(
    (attrDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(
        ChainSamplingDesign.assocFirstPhaseCommonAttributeUuid(attrDefUuid)
      )(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  const nodeDefFilter = useCallback(
    (nodeDef) => firstPhaseCategoryExtraDefNames.includes(NodeDef.getName(nodeDef)),
    [firstPhaseCategoryExtraDefNames]
  )

  return (
    <BaseUnitCodeAttributeSelector
      info="chainView.firstPhaseCommonAttribute.info"
      label="chainView.firstPhaseCommonAttribute.label"
      nodeDefFilter={nodeDefFilter}
      selectedNodeDefUuid={ChainSamplingDesign.getFirstPhaseCommonAttributeUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
