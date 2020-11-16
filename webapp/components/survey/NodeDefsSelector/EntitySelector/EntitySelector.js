import './EntitySelector.scss'
import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import Dropdown from '@webapp/components/form/Dropdown'

const getDropdownItems = (hierarchy, lang, nodeDefDisplayType) => {
  const entities = []

  const traverse = (nodeDef, depth) => {
    const label = nodeDefDisplayType(nodeDef, lang)
    entities.push({
      key: NodeDef.getUuid(nodeDef),
      value: `${StringUtils.nbsp}${R.repeat(StringUtils.nbsp, depth * 2).join('')}${label}`,
    })
  }

  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

  return entities
}

const EntitySelector = (props) => {
  const { hierarchy, nodeDefUuidEntity, lang, validation, onChange, nodeDefDisplayType } = props

  const dropdownItems = getDropdownItems(hierarchy, lang, nodeDefDisplayType)
  const selection = dropdownItems.find(R.propEq('key', nodeDefUuidEntity))

  return (
    <Dropdown
      className="entity-selector"
      autocompleteDialogClassName="entity-selector__dialog"
      items={dropdownItems}
      selection={selection}
      validation={validation}
      onChange={(item) => onChange(R.prop('key', item))}
    />
  )
}

EntitySelector.propTypes = {
  hierarchy: PropTypes.object.isRequired, // Survey hierarchy
  lang: PropTypes.string.isRequired,
  nodeDefUuidEntity: PropTypes.string, // Selected entity def uuid
  validation: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  nodeDefDisplayType: PropTypes.func,
}

EntitySelector.defaultProps = {
  nodeDefUuidEntity: null,
  validation: null,
  nodeDefDisplayType: NodeDef.getLabel,
}

export default EntitySelector
