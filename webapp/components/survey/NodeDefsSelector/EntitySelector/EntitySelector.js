import './EntitySelector.scss'
import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import { TestId } from '@webapp/utils/testId'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import Dropdown from '@webapp/components/form/Dropdown'

const getDropdownItems = ({
  hierarchy,
  i18n,
  lang,
  nodeDefLabelType,
  showSingleEntities,
  useNameAsLabel,
  allowEmptySelection,
}) => {
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

  return [...(allowEmptySelection ? [{ key: 'null', value: i18n.t('common.notSpecified') }] : []), ...entities]
}

const EntitySelector = (props) => {
  const {
    hierarchy,
    nodeDefUuidEntity,
    validation,
    onChange,
    nodeDefLabelType,
    showSingleEntities,
    disabled,
    useNameAsLabel,
    allowEmptySelection,
  } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const dropdownItems = getDropdownItems({
    hierarchy,
    i18n,
    lang,
    nodeDefLabelType,
    showSingleEntities,
    useNameAsLabel,
    allowEmptySelection,
  })
  const selection = dropdownItems.find(R.propEq('key', nodeDefUuidEntity))

  return (
    <Dropdown
      idInput={TestId.entities.entitySelector}
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
  nodeDefUuidEntity: PropTypes.string, // Selected entity def uuid
  showSingleEntities: PropTypes.bool,
  disabled: PropTypes.bool,
  useNameAsLabel: PropTypes.bool,
  validation: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  nodeDefLabelType: PropTypes.string,
  allowEmptySelection: PropTypes.bool,
}

EntitySelector.defaultProps = {
  nodeDefUuidEntity: null,
  showSingleEntities: true,
  disabled: false,
  useNameAsLabel: false,
  validation: null,
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
  allowEmptySelection: false,
}

export default EntitySelector
