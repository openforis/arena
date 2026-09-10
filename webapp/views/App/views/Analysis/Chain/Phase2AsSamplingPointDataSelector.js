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

  const onChange = (value) => {
    const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocPhase2AsSamplingPointData(value))(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

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
