import './AttributeSelector.scss'
import React from 'react'
import * as PropTypes from 'prop-types'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

const AttributeSelector = (props) => {
  const {
    canSelectAttributes,
    filterTypes,
    lang,
    nodeDef,
    nodeDefUuidsAttributes,
    nodeDefContext,
    onToggleAttribute,
    showMultipleAttributes,
    itemLabel,
  } = props
  const isAttributeFn = showMultipleAttributes ? NodeDef.isAttribute : NodeDef.isSingleAttribute
  const isVisible =
    (isAttributeFn(nodeDef) || NodeDef.isEqual(nodeDef)(nodeDefContext)) &&
    (R.isEmpty(filterTypes) || R.includes(NodeDef.getType(nodeDef), filterTypes))

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)
  const isActive = R.includes(nodeDefUuid, nodeDefUuidsAttributes)

  return (
    isVisible && (
      <button
        type="button"
        className={`btn btn-s deselectable attribute-selector${isActive ? ' active' : ''}`}
        onClick={() => onToggleAttribute(nodeDefUuid)}
        disabled={!canSelectAttributes}
      >
        {itemLabel(nodeDef, lang)}
        {NodeDefUIProps.getIconByType(nodeDefType)}
      </button>
    )
  )
}

AttributeSelector.propTypes = {
  canSelectAttributes: PropTypes.bool,
  filterTypes: PropTypes.array,
  lang: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodeDefContext: PropTypes.object.isRequired,
  nodeDefUuidsAttributes: PropTypes.array.isRequired,
  onToggleAttribute: PropTypes.func.isRequired,
  showMultipleAttributes: PropTypes.bool,
  itemLabel: PropTypes.func,
}

AttributeSelector.defaultProps = {
  canSelectAttributes: true,
  filterTypes: [],
  showMultipleAttributes: true,
  itemLabel: NodeDef.getLabel,
}

export default AttributeSelector
