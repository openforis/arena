import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

export const Phase2JoinEntitySelector = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()

  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  const hierarchy = Survey.getHierarchy(
    (nodeDef) =>
      NodeDef.isRoot(nodeDef) ||
      (Boolean(baseUnitNodeDef) &&
        (NodeDef.getUuid(nodeDef) === NodeDef.getUuid(baseUnitNodeDef) ||
          NodeDef.isAncestorOf(baseUnitNodeDef)(nodeDef)))
  )(survey)

  const selectedEntityUuid = ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)

  const onChange = useCallback(
    (entityDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(
        ChainSamplingDesign.assocPhase2JoinEntityUuid(entityDefUuid === 'null' ? null : entityDefUuid)
      )(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [dispatch, chain]
  )

  return (
    <FormItem label="chainView.phase2JoinEntity.label" info="chainView.phase2JoinEntity.info">
      <EntitySelector
        hierarchy={hierarchy}
        nodeDefUuidEntity={selectedEntityUuid}
        onChange={onChange}
        showSingleEntities={true}
        useNameAsLabel={true}
        allowEmptySelection={true}
        disabled={!editable}
      />
    </FormItem>
  )
}
