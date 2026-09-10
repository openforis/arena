import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

export const Phase2AsSamplingPointDataSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  /* eslint-disable react-hooks/preserve-manual-memoization -- pre-existing: React Compiler cannot preserve this callback's memoization here (unrelated to this task, reproduces on master too) */
  const onChange = useCallback(
    (value) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocPhase2AsSamplingPointData(value))(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [dispatch, chain]
  )
  /* eslint-enable react-hooks/preserve-manual-memoization */

  return (
    <FormItem label="chainView.phase2AsSamplingPointData.label">
      <Checkbox
        checked={ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)}
        onChange={onChange}
        disabled={!editable}
      />
    </FormItem>
  )
}
