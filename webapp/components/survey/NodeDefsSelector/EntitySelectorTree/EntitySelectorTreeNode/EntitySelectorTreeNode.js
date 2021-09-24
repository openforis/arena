import './EntitySelectorTreeNode.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useNodeDefLabel, useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useNodeDefLabelType } from '@webapp/store/ui/surveyForm'
import { DataTestId } from '@webapp/utils/dataTestId'

import { useOnUpdate } from '@webapp/components/hooks'

const EntitySelectorTreeNode = (props) => {
  const { expanded, getLabelSuffix, isDisabled, nodeDef, nodeDefUuidActive, onlyPages, onSelect } = props

  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const label = useNodeDefLabel(nodeDef, useNodeDefLabelType())
  const childEntityDefs = onlyPages
    ? Survey.getNodeDefChildrenInOwnPage({ nodeDef, cycle })(survey)
    : Survey.getNodeDefDescendantsInSingleEntities({ nodeDef, filterFn: NodeDef.isMultipleEntity })(survey)
  const root = NodeDef.isRoot(nodeDef)

  const [showChildren, setShowChildren] = useState(root || expanded)
  const toggleShowChildren = () => setShowChildren((prevState) => !prevState)

  useOnUpdate(() => {
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
          {getLabelSuffix(nodeDef)}
        </button>
      </div>

      {showChildren &&
        childEntityDefs.map((nodeDefChild) => (
          <EntitySelectorTreeNode
            key={NodeDef.getUuid(nodeDefChild)}
            expanded={expanded}
            getLabelSuffix={getLabelSuffix}
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
  getLabelSuffix: PropTypes.func.isRequired,
  isDisabled: PropTypes.func.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodeDefUuidActive: PropTypes.string,
  onlyPages: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
}

EntitySelectorTreeNode.defaultProps = {
  nodeDefUuidActive: null,
}

export { EntitySelectorTreeNode }
