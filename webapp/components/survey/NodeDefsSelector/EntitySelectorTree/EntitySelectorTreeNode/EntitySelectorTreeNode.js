import './EntitySelectorTreeNode.scss'
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useNodeDefLabel, useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useNodeDefLabelType } from '@webapp/store/ui/surveyForm'
import { DataTestId } from '@webapp/utils/dataTestId'

const EntitySelectorTreeNode = (props) => {
  const { expanded, isDisabled, nodeDef, nodeDefUuidActive, onlyPages, onSelect } = props

  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const label = useNodeDefLabel(nodeDef, useNodeDefLabelType())
  const childDefs = Survey.getNodeDefChildren(nodeDef, true)(survey)
  const childEntityDefs = onlyPages
    ? NodeDefLayout.filterNodeDefsWithPage(cycle)(childDefs)
    : childDefs.filter(NodeDef.isEntity)
  const root = NodeDef.isRoot(nodeDef)

  const [showChildren, setShowChildren] = useState(root)
  const toggleShowChildren = () => setShowChildren((prevState) => !prevState)

  useEffect(() => {
    setShowChildren(expanded)
  }, [expanded])

  return (
    <div className={classNames('entity-selector-tree-node-wrapper', { 'is-root': root })}>
      <div className={classNames('display-flex', 'entity-selector-tree-node', { 'with-children': showChildren })}>
        {childEntityDefs.length > 0 && (
          <button type="button" className="btn-xs btn-toggle" onClick={toggleShowChildren}>
            <span className="icon icon-play3 icon-14px" />
          </button>
        )}

        <button
          type="button"
          className={classNames('btn', 'btn-s', 'btn-node-def', {
            active: NodeDef.getUuid(nodeDef) === nodeDefUuidActive,
          })}
          data-testid={DataTestId.surveyForm.pageLinkBtn(NodeDef.getName(nodeDef))}
          onClick={() => onSelect(nodeDef)}
          aria-disabled={isDisabled(nodeDef)}
        >
          {label}
        </button>
      </div>

      {showChildren &&
        childEntityDefs.map((nodeDefChild) => (
          <EntitySelectorTreeNode
            key={NodeDef.getUuid(nodeDefChild)}
            expanded={expanded}
            isDisabled={isDisabled}
            nodeDef={nodeDefChild}
            nodeDefUuidActive={nodeDefUuidActive}
            onlyPages={onlyPages}
            onSelect={onSelect}
          />
        ))}
    </div>
  )
}

EntitySelectorTreeNode.propTypes = {
  expanded: PropTypes.bool.isRequired,
  isDisabled: PropTypes.func.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodeDefUuidActive: PropTypes.string.isRequired,
  onlyPages: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
}

export { EntitySelectorTreeNode }
