import React, { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

import { BaseUnitAttributeSelector } from './BaseUnitAttributeSelector'

export const StratumAttributeSelector = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
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

  const isTwoPhase = ChainSamplingDesign.isPhase1CategorySelectionEnabled(samplingDesign)
  const label = isTwoPhase ? 'chainView.stratumAttribute2ndPhase' : 'chainView.stratumAttribute'
  const info = isTwoPhase ? 'chainView.stratumAttribute2ndPhaseInfo' : 'chainView.stratumAttributeInfo'

  const phase1CategoryUuid = ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)
  const phase1Category = phase1CategoryUuid ? Survey.getCategoryByUuid(phase1CategoryUuid)(survey) : null

  /* eslint-disable react-hooks/preserve-manual-memoization -- React Compiler cannot preserve this memoization here (dependencies may be mutated later) */
  const nodeDefFilter = useMemo(() => {
    if (!isTwoPhase) return null
    const candidateNames = new Set(['code', ...(phase1Category ? Category.getItemExtraDefKeys(phase1Category) : [])])
    return (nodeDef) => candidateNames.has(NodeDef.getName(nodeDef))
  }, [isTwoPhase, phase1Category])
  /* eslint-enable react-hooks/preserve-manual-memoization */

  return (
    <BaseUnitAttributeSelector
      allowEmptySelection={ChainSamplingDesign.isStratificationNotSpecifiedAllowed(samplingDesign)}
      info={info}
      label={label}
      nodeDefFilter={nodeDefFilter}
      selectedNodeDefUuid={ChainSamplingDesign.getStratumNodeDefUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
