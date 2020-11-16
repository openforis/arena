import './AttributeSelector.scss'
import React from 'react'
import { useSelector } from 'react-redux'
import * as PropTypes from 'prop-types'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import { SurveyFormState } from '@webapp/store/ui'

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
  } = props
  const isAttributeFn = showMultipleAttributes ? NodeDef.isAttribute : NodeDef.isSingleAttribute
  const isVisible =
    (isAttributeFn(nodeDef) || NodeDef.isEqual(nodeDef)(nodeDefContext)) &&
    (R.isEmpty(filterTypes) || R.includes(NodeDef.getType(nodeDef), filterTypes))

  const itemLabelFunction = useSelector(SurveyFormState.getNodeDefLabel)
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
        {itemLabelFunction(nodeDef, lang)}
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
}

AttributeSelector.defaultProps = {
  canSelectAttributes: true,
  filterTypes: [],
  showMultipleAttributes: true,
}

export default AttributeSelector
