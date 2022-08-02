import React from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'

import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

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
  const selectedEntityUuid = Chain.getClusteringNodeDefUuid(chain)

  const onChange = (entityDefUuid) => {
    const chainUpdated = Chain.assocClusteringNodeDefUuid(entityDefUuid === 'null' ? null : entityDefUuid)(chain)
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
