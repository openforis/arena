import React, { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

const allowedNodeDefTypes = new Set([NodeDef.nodeDefType.code, NodeDef.nodeDefType.text])

const nodeDefToItem = (nodeDef) => ({
  value: NodeDef.getUuid(nodeDef),
  label: NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name),
})

export const Phase2JoinAttributeSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const phase2JoinEntityUuid = ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)
  const phase2JoinEntity = phase2JoinEntityUuid ? Survey.getNodeDefByUuid(phase2JoinEntityUuid)(survey) : null

  /* eslint-disable react-hooks/preserve-manual-memoization -- React Compiler cannot preserve this memoization here (unrelated to this task, reproduces on master too) */
  const selectableDefs = useMemo(() => {
    if (!phase2JoinEntity) return []
    return Survey.getNodeDefDescendantAttributesInSingleEntities({
      nodeDef: phase2JoinEntity,
      includeAnalysis: true,
    })(survey).filter((descendantDef) => allowedNodeDefTypes.has(NodeDef.getType(descendantDef)))
  }, [phase2JoinEntity, survey])
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }
  const items = [emptyItem, ...selectableDefs.map(nodeDefToItem)]

  const selectedNodeDefUuid = ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)
  const selectedDef = selectedNodeDefUuid
    ? selectableDefs.find((def) => NodeDef.getUuid(def) === selectedNodeDefUuid)
    : null
  const selectedItem = selectedDef ? nodeDefToItem(selectedDef) : emptyItem

  const onChange = useCallback(
    (item) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocPhase2JoinAttribute(item?.value))(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  return (
    <FormItem label="chainView.phase2JoinAttribute.label" info="chainView.phase2JoinAttribute.info">
      <Dropdown items={items} selection={selectedItem} onChange={onChange} disabled={!editable || !phase2JoinEntity} />
    </FormItem>
  )
}
