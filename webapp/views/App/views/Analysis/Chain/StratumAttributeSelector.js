import React from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

export const StratumAttributeSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  const onChange = (item) => {
    const stratumNodeDefUuid = item?.value
    const chainUpdated = Chain.assocStratumNodeDefUuid(stratumNodeDefUuid)(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  // selectable attribute defs can be code attributes in base unit or its ancestors
  const selectableDefs = []
  if (baseUnitNodeDef) {
    Survey.visitAncestorsAndSelf(baseUnitNodeDef, (nodeDef) => {
      // search inside single entities
      const descendantDefs = Survey.getNodeDefDescendantAttributesInSingleEntities(nodeDef, true)(survey)
      selectableDefs.push(
        ...descendantDefs.filter(
          (descendantDef) =>
            //  only code attributes
            NodeDef.isCode(descendantDef) &&
            // adoid duplicates
            !selectableDefs.some(NodeDef.isEqual(descendantDef))
        )
      )
    })(survey)
  }

  const nodeDefToItem = (nodeDef) => ({
    value: NodeDef.getUuid(nodeDef),
    label: NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name),
  })

  const emptySelectionItem = { value: null, label: i18n.t('common.notSpecified') }
  const selectableItems = [
    ...(Chain.isStratificationNotSpecifiedAllowed(chain) ? [emptySelectionItem] : []),
    ...selectableDefs.map(nodeDefToItem),
  ]

  const selectedNodeDefUuid = Chain.getStratumNodeDefUuid(chain)
  const selectedNodeDef = selectedNodeDefUuid ? Survey.getNodeDefByUuid(selectedNodeDefUuid)(survey) : null
  const selectedItem = selectedNodeDef ? nodeDefToItem(selectedNodeDef) : emptySelectionItem

  return (
    <FormItem label={i18n.t('chainView.stratumAttribute')}>
      <Dropdown
        className="stratum-attribute-dropdown"
        selection={selectedItem}
        items={selectableItems}
        onChange={onChange}
      />
    </FormItem>
  )
}
