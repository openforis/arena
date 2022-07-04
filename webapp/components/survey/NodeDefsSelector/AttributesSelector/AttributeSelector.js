import './AttributeSelector.scss'
import React from 'react'
import * as PropTypes from 'prop-types'
import * as R from 'ramda'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import NodeDefIconKey from '@webapp/components/survey/SurveyForm/nodeDefs/components/NodeDefIconKey'
import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

const AttributeSelector = (props) => {
  const {
    canSelectAttributes,
    filterFunction,
    filterTypes,
    filterChainUuids,
    nodeDef,
    nodeDefUuidsAttributes,
    nodeDefContext,
    onToggleAttribute,
    showMultipleAttributes,
    showNodeDefPath,
    nodeDefLabelType,
  } = props

  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const cycle = useSurveyCycleKey()

  const isAttributeFn = showMultipleAttributes ? NodeDef.isAttribute : NodeDef.isSingleAttribute
  const isVisible =
    (isAttributeFn(nodeDef) || NodeDef.isEqual(nodeDef)(nodeDefContext)) &&
    NodeDef.getCycles(nodeDef).includes(cycle) &&
    (filterFunction === null || filterFunction(nodeDef)) &&
    (R.isEmpty(filterTypes) || R.includes(NodeDef.getType(nodeDef), filterTypes)) &&
    (R.isEmpty(filterChainUuids) ||
      R.isEmpty(NodeDef.getChainUuid(nodeDef)) ||
      R.includes(NodeDef.getChainUuid(nodeDef), filterChainUuids))

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)
  const active = R.includes(nodeDefUuid, nodeDefUuidsAttributes)

  return (
    isVisible && (
      <button
        type="button"
        className={classNames('btn btn-s deselectable attribute-selector', {
          active,
          'not-selectable': !canSelectAttributes,
        })}
        onClick={canSelectAttributes ? () => onToggleAttribute(nodeDefUuid) : null}
        title={
          showNodeDefPath
            ? Survey.getNodeDefPath({ nodeDef, showLabels: true, labelLang: lang })(survey)
            : NodeDef.getDescription(lang)(nodeDef)
        }
      >
        <span>
          <NodeDefIconKey nodeDef={nodeDef} />
          {NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })}
        </span>
        {NodeDefUIProps.getIconByType(nodeDefType)}
      </button>
    )
  )
}

AttributeSelector.propTypes = {
  canSelectAttributes: PropTypes.bool,
  filterFunction: PropTypes.func,
  filterTypes: PropTypes.array,
  filterChainUuids: PropTypes.array,
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
  filterFunction: null,
  filterTypes: [],
  filterChainUuids: [],
  showMultipleAttributes: true,
  showNodeDefPath: false,
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
}

export default AttributeSelector
