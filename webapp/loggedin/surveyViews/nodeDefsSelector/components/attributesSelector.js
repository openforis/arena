import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyState from '@webapp/survey/surveyState'
import * as NodeDefUiProps from '../../surveyForm/nodeDefs/nodeDefUIProps'

const AttributeSelector = props => {
  const {
    nodeDefContext,
    nodeDef,
    lang,
    nodeDefUuidsAttributes,
    onToggleAttribute,
    filterTypes,
    canSelectAttributes,
    showMultipleAttributes,
  } = props

  const isAttributeFn = showMultipleAttributes
    ? NodeDef.isAttribute
    : NodeDef.isSingleAttribute
  const isVisible =
    (isAttributeFn(nodeDef) || NodeDef.isEqual(nodeDef)(nodeDefContext)) &&
    (R.isEmpty(filterTypes) ||
      R.includes(NodeDef.getType(nodeDef), filterTypes))

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)
  const isActive = R.includes(nodeDefUuid, nodeDefUuidsAttributes)

  return (
    isVisible && (
      <button
        className={`btn btn-s btn-node-def${isActive ? ' active' : ''}`}
        onClick={() => onToggleAttribute(nodeDefUuid)}
        disabled={!canSelectAttributes}
      >
        {NodeDef.getLabel(nodeDef, lang)}
        {NodeDefUiProps.getIconByType(nodeDefType)}
      </button>
    )
  )
}

const AttributesSelector = props => {
  const {
    nodeDefContext,
    nodeDefParent,
    childDefs,
    lang,
    nodeDefUuidsAttributes,
    onToggleAttribute,
    filterTypes,
    canSelectAttributes,
    showAncestors,
    showMultipleAttributes,
  } = props

  return (
    childDefs && (
      <React.Fragment>
        {childDefs.map((childDef, i) => (
          <AttributeSelector
            key={i}
            nodeDefContext={nodeDefContext}
            nodeDef={childDef}
            lang={lang}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            onToggleAttribute={onToggleAttribute}
            filterTypes={filterTypes}
            canSelectAttributes={canSelectAttributes}
            showMultipleAttributes={showMultipleAttributes}
          />
        ))}

        {showAncestors && nodeDefParent && (
          <React.Fragment>
            <div className="node-def-label">
              {NodeDef.getLabel(nodeDefParent, lang)}
            </div>
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
        )}
      </React.Fragment>
    )
  )
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
  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidEntity)(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDefContext)(survey)
  const childDefs = nodeDefContext
    ? NodeDef.isEntity(nodeDefContext)
      ? Survey.getNodeDefChildren(nodeDefContext)(survey)
      : [nodeDefContext] // Multiple attribute
    : []

  return {
    nodeDefContext,
    nodeDefParent,
    childDefs,
  }
}

const AttributesSelectorConnect = connect(mapStateToProps)(AttributesSelector)
export default AttributesSelectorConnect
