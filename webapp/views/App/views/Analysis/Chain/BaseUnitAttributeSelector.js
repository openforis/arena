import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain, useChainEditable } from '@webapp/store/ui/chain'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import ValidationTooltip from '@webapp/components/validationTooltip'

const nodeDefToItem = (nodeDef) => ({
  value: NodeDef.getUuid(nodeDef),
  label: NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name),
})

export const BaseUnitAttributeSelector = (props) => {
  const {
    allowEmptySelection,
    info,
    label,
    nodeDefFilter,
    nodeDefTypes = [NodeDef.nodeDefType.code],
    onChange: onChangeProp,
    selectedNodeDefUuid,
    validation,
  } = props

  const i18n = useI18n()
  const chain = useChain()
  const editable = useChainEditable()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  // selectable attribute defs can be attributes of the allowed types in base unit or its ancestors
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
            // only attributes of the allowed types
            nodeDefTypes.includes(NodeDef.getType(descendantDef)) &&
            // avoid duplicates
            !result.some(NodeDef.isEqual(descendantDef)) &&
            (!nodeDefFilter || nodeDefFilter(descendantDef))
        )
      )
    })(survey)

    return result
  }, [baseUnitNodeDef, nodeDefFilter, nodeDefTypes, survey])

  const onChange = useCallback((item) => onChangeProp(item?.value), [onChangeProp])

  const emptySelectionItem = { value: null, label: i18n.t('common.notSpecified') }
  const selectableItems = [...(allowEmptySelection ? [emptySelectionItem] : []), ...selectableDefs.map(nodeDefToItem)]

  const selectedNodeDef = selectedNodeDefUuid ? Survey.getNodeDefByUuid(selectedNodeDefUuid)(survey) : null
  const selectedItem = selectedNodeDef ? nodeDefToItem(selectedNodeDef) : emptySelectionItem

  const dropdown = (
    <Dropdown selection={selectedItem} items={selectableItems} onChange={onChange} disabled={!editable} />
  )

  return (
    <FormItem label={label} info={info}>
      {validation ? <ValidationTooltip validation={validation}>{dropdown}</ValidationTooltip> : dropdown}
    </FormItem>
  )
}

BaseUnitAttributeSelector.propTypes = {
  allowEmptySelection: PropTypes.bool,
  info: PropTypes.string,
  label: PropTypes.string.isRequired,
  nodeDefFilter: PropTypes.func,
  nodeDefTypes: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  selectedNodeDefUuid: PropTypes.string,
  validation: PropTypes.object,
}
