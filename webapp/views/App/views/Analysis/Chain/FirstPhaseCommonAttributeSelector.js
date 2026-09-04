import React from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { BaseUnitAttributeSelector } from './BaseUnitAttributeSelector'

export const FirstPhaseCommonAttributeSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = (attrDefUuid) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocFirstPhaseCommonAttributeUuid(attrDefUuid)
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <BaseUnitAttributeSelector
      info="chainView.firstPhaseCommonAttribute.info"
      label="chainView.firstPhaseCommonAttribute.label"
      nodeDefTypes={[NodeDef.nodeDefType.code, NodeDef.nodeDefType.text]}
      selectedNodeDefUuid={ChainSamplingDesign.getFirstPhaseCommonAttributeUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
