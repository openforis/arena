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

  const availableCodeAttributeDefs = []
  Survey.visitAncestorsAndSelf(baseUnitNodeDef, (entityDef) => {
    availableCodeAttributeDefs.push(
      ...Survey.getNodeDefChildren(
        entityDef,
        true
      )(survey).filter(
        (nodeDef) => NodeDef.isCode(nodeDef) && NodeDef.getUuid(nodeDef) !== Chain.getStratumNodeDefUuid(chain)
      )
    )
  })(survey)

  const selectedCodeAttributeDef = availableCodeAttributeDefs.find(
    (nodeDef) => NodeDef.getUuid(nodeDef) === Chain.getPostStratificationAttributeDefUuid(chain)
  )

  const codeAttributeDefToItem = (codeAttributeDef) => ({
    key: codeAttributeDef.uuid,
    label: NodeDef.getName(codeAttributeDef),
  })

  const emptyItem = { key: null, label: i18n.t('common.notSpecified') }

  const items = [emptyItem, ...availableCodeAttributeDefs.map(codeAttributeDefToItem)]

  const selectedItem = selectedCodeAttributeDef ? codeAttributeDefToItem(selectedCodeAttributeDef) : emptyItem

  const onChange = (item) => {
    const chainUpdated = Chain.assocPostStratificationAttributeDefUuid(item?.key)(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label={i18n.t('chainView.postStratificationAttribute')}>
      <Dropdown
        className="post-stratification-attribute-dropdown"
        items={items}
        selection={selectedItem}
        itemLabel="label"
        onChange={onChange}
      />
    </FormItem>
  )
}
