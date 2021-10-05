import './EntitySelector.scss'
import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import Dropdown from '@webapp/components/form/Dropdown'
import { DataTestId } from '@webapp/utils/dataTestId'

const getDropdownItems = ({ hierarchy, lang, nodeDefLabelType, showSingleEntities, useNameAsLabel }) => {
  const entities = []

  const traverse = (nodeDef, depth) => {
    if (NodeDef.isRoot(nodeDef) || showSingleEntities || !NodeDef.isSingleEntity(nodeDef)) {
      const label = useNameAsLabel
        ? NodeDef.getName(nodeDef)
        : NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })
      entities.push({
        key: NodeDef.getUuid(nodeDef),
        value: `${StringUtils.nbsp}${R.repeat(StringUtils.nbsp, depth * 2).join('')}${label}`,
      })
    }
  }

  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

  return entities
}

const EntitySelector = (props) => {
  const {
    hierarchy,
    nodeDefUuidEntity,
    lang,
    validation,
    onChange,
    nodeDefLabelType,
    showSingleEntities,
    disabled,
    useNameAsLabel,
  } = props

  const dropdownItems = getDropdownItems({ hierarchy, lang, nodeDefLabelType, showSingleEntities, useNameAsLabel })
  const selection = dropdownItems.find(R.propEq('key', nodeDefUuidEntity))

  return (
    <Dropdown
      idInput={DataTestId.entities.entitySelector}
      className="entity-selector"
      autocompleteDialogClassName="entity-selector__dialog"
      items={dropdownItems}
      selection={selection}
      validation={validation}
      onChange={(item) => onChange(R.prop('key', item))}
      disabled={disabled}
    />
  )
}

EntitySelector.propTypes = {
  hierarchy: PropTypes.object.isRequired, // Survey hierarchy
  lang: PropTypes.string.isRequired,
  nodeDefUuidEntity: PropTypes.string, // Selected entity def uuid
  showSingleEntities: PropTypes.bool,
  disabled: PropTypes.bool,
  useNameAsLabel: PropTypes.bool,
  validation: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  nodeDefLabelType: PropTypes.string,
}

EntitySelector.defaultProps = {
  nodeDefUuidEntity: null,
  showSingleEntities: true,
  disabled: false,
  useNameAsLabel: false,
  validation: null,
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
}

export default EntitySelector
