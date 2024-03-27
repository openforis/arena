import React from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

export const ClusteringEntitySelector = () => {
  const dispatch = useDispatch()

  const i18n = useI18n()
  const chain = useChain()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hierarchy = Survey.getHierarchy(
    (nodeDef) =>
      NodeDef.isRoot(nodeDef) || (NodeDef.isMultipleEntity(nodeDef) && NodeDef.isAncestorOf(baseUnitNodeDef)(nodeDef))
  )(survey)
  const samplingDesign = Chain.getSamplingDesign(chain)
  const selectedEntityUuid = ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign)

  const onChange = (entityDefUuid) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocClusteringNodeDefUuid(entityDefUuid === 'null' ? null : entityDefUuid)
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label={i18n.t('chainView.clusteringEntity')}>
      <EntitySelector
        hierarchy={hierarchy}
        nodeDefUuidEntity={selectedEntityUuid}
        onChange={onChange}
        showSingleEntities={false}
        useNameAsLabel={true}
        allowEmptySelection={true}
      />
    </FormItem>
  )
}
