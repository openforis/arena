import React from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

export const PostStratificationAttributeSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const chain = useChain()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  const selectableDefs = []
  Survey.visitAncestorsAndSelf(baseUnitNodeDef, (entityDef) => {
    // search inside single entities
    const descendantDefs = Survey.getNodeDefDescendantAttributesInSingleEntities(entityDef, true)(survey)

    selectableDefs.push(
      ...descendantDefs.filter(
        (descendantDef) =>
          // only code attributes
          NodeDef.isCode(descendantDef) &&
          // do not allow selecting stratum attribute def
          NodeDef.getUuid(descendantDef) !== Chain.getStratumNodeDefUuid(chain) &&
          // avoid duplicates
          !selectableDefs.some(NodeDef.isEqual(descendantDef))
      )
    )
  })(survey)

  const selectedCodeAttributeDef = selectableDefs.find(
    (nodeDef) => NodeDef.getUuid(nodeDef) === Chain.getPostStratificationAttributeDefUuid(chain)
  )

  const codeAttributeDefToItem = (codeAttributeDef) => ({
    value: codeAttributeDef.uuid,
    label: NodeDef.getLabel(codeAttributeDef, null, NodeDef.NodeDefLabelTypes.name),
  })

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }

  const items = [emptyItem, ...selectableDefs.map(codeAttributeDefToItem)]

  const selectedItem = selectedCodeAttributeDef ? codeAttributeDefToItem(selectedCodeAttributeDef) : emptyItem

  const onChange = (item) => {
    const chainUpdated = Chain.assocPostStratificationAttributeDefUuid(item?.value)(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label={i18n.t('chainView.postStratificationAttribute')}>
      <Dropdown
        className="post-stratification-attribute-dropdown"
        items={items}
        selection={selectedItem}
        onChange={onChange}
      />
    </FormItem>
  )
}
