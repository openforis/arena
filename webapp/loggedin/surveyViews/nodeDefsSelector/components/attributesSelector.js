import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import * as NodeDefUiProps from '../../surveyForm/nodeDefs/nodeDefSystemProps'

import * as SurveyState from '../../../../survey/surveyState'

const AttributeSelector = (props) => {

  const {
    nodeDef, lang, nodeDefUuidsAttributes,
    onToggleAttribute,
    filterTypes, canSelectAttributes, showMultipleAttributes
  } = props

  const isAttributeFn = showMultipleAttributes ? NodeDef.isAttribute : NodeDef.isSingleAttribute
  const isVisible = isAttributeFn(nodeDef) &&
    (R.isEmpty(filterTypes) || R.includes(NodeDef.getType(nodeDef), filterTypes))

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)
  const isActive = R.includes(nodeDefUuid, nodeDefUuidsAttributes)

  return isVisible &&
    <button className={`btn btn-s btn-node-def${isActive ? ' active' : ''}`}
            onClick={() => onToggleAttribute(nodeDefUuid)}
            disabled={!canSelectAttributes}>
      {NodeDef.getLabel(nodeDef, lang)}
      {NodeDefUiProps.getNodeDefIconByType(nodeDefType)}
    </button>

}

const AttributesSelector = (props) => {

  const {
    nodeDefParent, childDefs, lang,
    nodeDefUuidsAttributes, onToggleAttribute,
    filterTypes, canSelectAttributes, showAncestors, showMultipleAttributes,
  } = props

  return childDefs &&
    <React.Fragment>
      {
        childDefs.map((childDef, i) => (
          <AttributeSelector
            key={i}
            nodeDef={childDef}
            lang={lang}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            onToggleAttribute={onToggleAttribute}
            filterTypes={filterTypes}
            canSelectAttributes={canSelectAttributes}
            showMultipleAttributes={showMultipleAttributes}
          />
        ))
      }

      {
        showAncestors && nodeDefParent &&
        <React.Fragment>
          <div className="node-def-label">{NodeDef.getLabel(nodeDefParent, lang)}</div>
          <AttributesSelectorConnect
            lang={lang}
            nodeDefUuidEntity={NodeDef.getUuid(nodeDefParent)}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            onToggleAttribute={onToggleAttribute}
            filterTypes={filterTypes}
            canSelectAttributes={canSelectAttributes}
            showMultipleAttributes={showMultipleAttributes}
          />
        </React.Fragment>
      }

    </React.Fragment>

}

AttributesSelector.defaultProps = {
  nodeDefUuidEntity: '',
  nodeDefUuidsAttributes: [],
  lang: null,
  onToggleAttribute: null,
  filterTypes: [],
  canSelectAttributes: true,
  showAncestors: true,
  showMultipleAttributes: true,
}

const mapStateToProps = (state, props) => {
  const { nodeDefUuidEntity } = props

  const survey = SurveyState.getSurvey(state)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuidEntity)(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const childDefs = nodeDefUuidEntity
    ? Survey.getNodeDefChildren(nodeDef)(survey)
    : []

  return {
    nodeDefParent,
    childDefs,
  }
}

const AttributesSelectorConnect = connect(mapStateToProps)(AttributesSelector)
export default AttributesSelectorConnect