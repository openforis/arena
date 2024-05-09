import './EntitySelectorTreeNode.scss'
import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { useNodeDefLabel, useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useNodeDefLabelType, usePagesUuidMap } from '@webapp/store/ui/surveyForm'
import { useRecord } from '@webapp/store/ui/record'
import { TestId } from '@webapp/utils/testId'

import { useOnUpdate } from '@webapp/components/hooks'

const EntitySelectorTreeNode = (props) => {
  const {
    expanded,
    getLabelSuffix,
    isDisabled,
    nodeDef,
    nodeDefLabelType: nodeDefLabelTypeProp,
    nodeDefUuidActive,
    onlyPages,
    onlyEntities,
    onSelect,
  } = props

  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const nodeDefLabelTypeState = useNodeDefLabelType()
  const nodeDefLabelType = nodeDefLabelTypeProp || nodeDefLabelTypeState
  const label = useNodeDefLabel(nodeDef, nodeDefLabelType)
  const record = useRecord()
  const pagesUuidMap = usePagesUuidMap()

  const root = NodeDef.isRoot(nodeDef)

  const [showChildren, setShowChildren] = useState(root || expanded)
  const toggleShowChildren = useCallback(() => setShowChildren((prevState) => !prevState), [])

  useOnUpdate(() => {
    setShowChildren(expanded)
  }, [expanded])

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const pageNodeUuid = pagesUuidMap[nodeDefUuid]
  const pageNode = record && pageNodeUuid ? Record.getNodeByUuid(pageNodeUuid)(record) : null
  const parentPageNodeUuid = pagesUuidMap[NodeDef.getParentUuid(nodeDef)]
  const parentPageNode = record && parentPageNodeUuid ? Record.getNodeByUuid(parentPageNodeUuid)(record) : null

  const isPageVisible = ({ pageNodeDef, parentNode }) =>
    NodeDef.isRoot(pageNodeDef) ||
    !NodeDefLayout.isHiddenWhenNotRelevant(cycle)(pageNodeDef) ||
    Node.isChildApplicable(NodeDef.getUuid(pageNodeDef))(parentNode) ||
    // has some non-empty descendant
    Record.getNodeChildrenByDefUuid(
      parentNode,
      NodeDef.getUuid(pageNodeDef)
    )(record).some((pageChildNode) => !Record.isNodeEmpty(pageChildNode)(record))

  const hidden =
    !root && record && parentPageNode && !isPageVisible({ pageNodeDef: nodeDef, parentNode: parentPageNode })

  const childrenPageDefs = onlyPages
    ? Survey.getNodeDefChildrenInOwnPage({ nodeDef, cycle })(survey)
    : Survey.getNodeDefDescendantsInSingleEntities({
        cycle,
        nodeDef,
        sorted: true,
        filterFn: onlyEntities ? NodeDef.isMultipleEntity : NodeDef.isMultiple,
      })(survey)

  const visibleChildren = pageNode
    ? childrenPageDefs.filter((childDef) => isPageVisible({ pageNodeDef: childDef, parentNode: pageNode }))
    : childrenPageDefs

  const availableChildren = visibleChildren.filter((childDef) => !isDisabled(childDef))

  const hasChildren = availableChildren.length > 0

  return (
    <div className={classNames('entity-selector-tree-node-wrapper', { 'is-root': root, hidden })}>
      <div
        className={classNames('display-flex', 'entity-selector-tree-node', {
          'with-children': showChildren,
        })}
      >
        {hasChildren && (
          <button type="button" className="btn-xs btn-toggle" onClick={toggleShowChildren}>
            <span className="icon icon-play3 icon-14px" />
          </button>
        )}

        <button
          type="button"
          className={classNames('btn', 'btn-s', 'btn-node-def', {
            active: nodeDefUuid === nodeDefUuidActive,
          })}
          data-testid={TestId.surveyForm.pageLinkBtn(NodeDef.getName(nodeDef))}
          onClick={() => onSelect(nodeDef)}
        >
          {label}
          {getLabelSuffix(nodeDef)}
        </button>
      </div>

      {showChildren &&
        availableChildren.map((nodeDefChild) => (
          <EntitySelectorTreeNode
            key={NodeDef.getUuid(nodeDefChild)}
            expanded={expanded}
            getLabelSuffix={getLabelSuffix}
            isDisabled={isDisabled}
            nodeDef={nodeDefChild}
            nodeDefLabelType={nodeDefLabelType}
            nodeDefUuidActive={nodeDefUuidActive}
            onlyEntities={onlyEntities}
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
  nodeDefLabelType: PropTypes.string,
  nodeDefUuidActive: PropTypes.string,
  onlyEntities: PropTypes.bool,
  onlyPages: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
}

EntitySelectorTreeNode.defaultProps = {
  nodeDefLabelType: null,
  nodeDefUuidActive: null,
  onlyEntities: true,
}

export { EntitySelectorTreeNode }
