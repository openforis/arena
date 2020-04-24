import React from 'react'
import * as PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUiProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

import { useSurvey } from '@webapp/commonComponents/hooks'

const AttributesSelector = (props) => {
  const {
    canSelectAttributes,
    filterTypes,
    lang,
    nodeDefUuidEntity,
    nodeDefUuidsAttributes,
    onToggleAttribute,
    showAncestors,
    showMultipleAttributes,
  } = props

  const survey = useSurvey()
  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidEntity)(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDefContext)(survey)

  let childDefs = []
  if (nodeDefContext) {
    childDefs = NodeDef.isEntity(nodeDefContext)
      ? Survey.getNodeDefChildren(nodeDefContext, true)(survey)
      : [nodeDefContext] // Multiple attribute
  }

  const AttributeSelector = ({ nodeDef }) => {
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

  AttributeSelector.propTypes = {
    nodeDef: PropTypes.object.isRequired,
  }

  return (
    childDefs && (
      <>
        {childDefs.map((childDef) => (
          <AttributeSelector key={NodeDef.getUuid(childDef)} nodeDef={childDef} />
        ))}

        {showAncestors && nodeDefParent && (
          <>
            <div className="node-def-label">{NodeDef.getLabel(nodeDefParent, lang)}</div>
            <AttributesSelector
              lang={lang}
              nodeDefUuidEntity={NodeDef.getUuid(nodeDefParent)}
              nodeDefUuidsAttributes={nodeDefUuidsAttributes}
              onToggleAttribute={onToggleAttribute}
              filterTypes={filterTypes}
              canSelectAttributes={canSelectAttributes}
              showMultipleAttributes={showMultipleAttributes}
            />
          </>
        )}
      </>
    )
  )
}

AttributesSelector.propTypes = {
  canSelectAttributes: PropTypes.bool,
  filterTypes: PropTypes.array,
  lang: PropTypes.string.isRequired,
  nodeDefUuidEntity: PropTypes.string,
  nodeDefUuidsAttributes: PropTypes.array,
  onToggleAttribute: PropTypes.func.isRequired,
  showAncestors: PropTypes.bool,
  showMultipleAttributes: PropTypes.bool,
}

AttributesSelector.defaultProps = {
  canSelectAttributes: true,
  filterTypes: [],
  nodeDefUuidEntity: null,
  nodeDefUuidsAttributes: [],
  showAncestors: true,
  showMultipleAttributes: true,
}

export default AttributesSelector
