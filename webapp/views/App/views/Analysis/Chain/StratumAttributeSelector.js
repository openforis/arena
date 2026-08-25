/* eslint-disable react-hooks/preserve-manual-memoization -- pre-existing: React Compiler cannot preserve the onChange callback's memoization here (unrelated to this change, reproduces on master too) */
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { BaseUnitCodeAttributeSelector } from './BaseUnitCodeAttributeSelector'

export const StratumAttributeSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = useCallback(
    (stratumDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocStratumNodeDefUuid(stratumDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  const label = ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign)
    ? 'chainView.stratumAttribute2ndPhase'
    : 'chainView.stratumAttribute'

  return (
    <BaseUnitCodeAttributeSelector
      allowEmptySelection={ChainSamplingDesign.isStratificationNotSpecifiedAllowed(samplingDesign)}
      label={label}
      selectedNodeDefUuid={ChainSamplingDesign.getStratumNodeDefUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
