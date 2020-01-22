import React from 'react'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as StringUtils from '@core/stringUtils'

import Dropdown from '@webapp/commonComponents/form/dropdown'

const _generateDropdownItems = (hierarchy, lang) => {
  const entities = []

  const traverse = (nodeDef, depth) => {
    const label = NodeDef.getLabel(nodeDef, lang)
    entities.push({
      key: NodeDef.getUuid(nodeDef),
      value: `${StringUtils.nbsp}${R.repeat(StringUtils.nbsp, depth * 2).join('')}${label}`,
    })
  }

  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

  return entities
}

const EntitySelector = props => {
  const { hierarchy, nodeDefUuidEntity, lang, validation, onChange } = props

  const dropdownItems = _generateDropdownItems(hierarchy, lang)
  const selection = dropdownItems.find(R.propEq('key', nodeDefUuidEntity))

  return (
    <Dropdown
      className="node-defs-selector__entity-selector"
      autocompleteDialogClassName="node-defs-selector__entity-selector-dialog"
      items={dropdownItems}
      selection={selection}
      validation={validation}
      onChange={item => onChange(R.prop('key', item))}
    />
  )
}

EntitySelector.defaultProps = {
  hierarchy: null, // Survey hierarchy
  nodeDefUuidEntity: null, // Selected entity def uuid
  lang: null,
  validation: null,
  onChange: null,
}

export default EntitySelector
