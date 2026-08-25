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

  /* eslint-disable react-hooks/preserve-manual-memoization -- pre-existing: React Compiler cannot preserve this callback's memoization here (unrelated to this task, reproduces on master too) */
  const onChange = useCallback(
    (stratumDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocStratumNodeDefUuid(stratumDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const isTwoPhase = ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign)
  const label = isTwoPhase ? 'chainView.stratumAttribute2ndPhase' : 'chainView.stratumAttribute'
  const info = isTwoPhase ? 'chainView.stratumAttribute2ndPhaseInfo' : 'chainView.stratumAttributeInfo'

  return (
    <BaseUnitCodeAttributeSelector
      allowEmptySelection={ChainSamplingDesign.isStratificationNotSpecifiedAllowed(samplingDesign)}
      info={info}
      label={label}
      selectedNodeDefUuid={ChainSamplingDesign.getStratumNodeDefUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
