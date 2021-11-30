import './AttributeSelector.scss'
import React from 'react'
import * as PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { useSurvey } from '@webapp/store/survey'

const AttributeSelector = (props) => {
  const {
    canSelectAttributes,
    filterTypes,
    filterChainUuids,
    lang,
    nodeDef,
    nodeDefUuidsAttributes,
    nodeDefContext,
    onToggleAttribute,
    showMultipleAttributes,
    showNodeDefPath,
    nodeDefLabelType,
  } = props

  const survey = useSurvey()

  const isAttributeFn = showMultipleAttributes ? NodeDef.isAttribute : NodeDef.isSingleAttribute
  const isVisible =
    (isAttributeFn(nodeDef) || NodeDef.isEqual(nodeDef)(nodeDefContext)) &&
    (R.isEmpty(filterTypes) || R.includes(NodeDef.getType(nodeDef), filterTypes)) &&
    (R.isEmpty(filterChainUuids) ||
      R.isEmpty(NodeDef.getChainUuid(nodeDef)) ||
      R.includes(NodeDef.getChainUuid(nodeDef), filterChainUuids))

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
        title={showNodeDefPath ? Survey.getNodeDefPath({ nodeDef, showLabels: true, labelLang: lang })(survey) : null}
      >
        {NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })}
        {NodeDefUIProps.getIconByType(nodeDefType)}
      </button>
    )
  )
}

AttributeSelector.propTypes = {
  canSelectAttributes: PropTypes.bool,
  filterTypes: PropTypes.array,
  filterChainUuids: PropTypes.array,
  lang: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodeDefContext: PropTypes.object.isRequired,
  nodeDefUuidsAttributes: PropTypes.array.isRequired,
  onToggleAttribute: PropTypes.func.isRequired,
  showMultipleAttributes: PropTypes.bool,
  showNodeDefPath: PropTypes.bool,
  nodeDefLabelType: PropTypes.string,
}

AttributeSelector.defaultProps = {
  canSelectAttributes: true,
  filterTypes: [],
  filterChainUuids: [],
  showMultipleAttributes: true,
  showNodeDefPath: false,
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
}

export default AttributeSelector
