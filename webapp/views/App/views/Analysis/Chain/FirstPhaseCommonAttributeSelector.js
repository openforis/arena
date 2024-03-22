import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { BaseUnitCodeAttributeSelector } from './BaseUnitCodeAttributeSelector'

export const FirstPhaseCommonAttributeSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = useCallback(
    (attrDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(
        ChainSamplingDesign.assocFirstPhaseCommonAttributeUuid(attrDefUuid)
      )(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  return (
    <BaseUnitCodeAttributeSelector
      info="chainView.firstPhaseCommonAttribute.info"
      label="chainView.firstPhaseCommonAttribute.label"
      selectedNodeDefUuid={ChainSamplingDesign.getFirstPhaseCommonAttributeUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
