import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

const nodeDefToItem = (nodeDef) => ({
  value: NodeDef.getUuid(nodeDef),
  label: NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name),
})

export const BaseUnitCodeAttributeSelector = (props) => {
  const { allowEmptySelection, info, label, nodeDefFilter, onChange: onChangeProp, selectedNodeDefUuid } = props

  const i18n = useI18n()
  const chain = useChain()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  // selectable attribute defs can be code attributes in base unit or its ancestors
  const selectableDefs = useMemo(() => {
    if (!baseUnitNodeDef) return []

    const result = []
    Survey.visitAncestorsAndSelf(baseUnitNodeDef, (nodeDef) => {
      // search inside single entities
      const descendantDefs = Survey.getNodeDefDescendantAttributesInSingleEntities({
        nodeDef,
        includeAnalysis: true,
      })(survey)
      result.push(
        ...descendantDefs.filter(
          (descendantDef) =>
            // only code attributes
            NodeDef.isCode(descendantDef) &&
            // avoid duplicates
            !result.some(NodeDef.isEqual(descendantDef)) &&
            (!nodeDefFilter || nodeDefFilter(descendantDef))
        )
      )
    })(survey)

    return result
  }, [baseUnitNodeDef, nodeDefFilter, survey])

  const onChange = useCallback((item) => onChangeProp(item?.value), [onChangeProp])

  const emptySelectionItem = { value: null, label: i18n.t('common.notSpecified') }
  const selectableItems = [...(allowEmptySelection ? [emptySelectionItem] : []), ...selectableDefs.map(nodeDefToItem)]

  const selectedNodeDef = selectedNodeDefUuid ? Survey.getNodeDefByUuid(selectedNodeDefUuid)(survey) : null
  const selectedItem = selectedNodeDef ? nodeDefToItem(selectedNodeDef) : emptySelectionItem

  return (
    <FormItem label={label} info={info}>
      <Dropdown selection={selectedItem} items={selectableItems} onChange={onChange} />
    </FormItem>
  )
}

BaseUnitCodeAttributeSelector.propTypes = {
  allowEmptySelection: PropTypes.bool,
  info: PropTypes.string,
  label: PropTypes.string.isRequired,
  nodeDefFilter: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  selectedNodeDefUuid: PropTypes.string,
}
