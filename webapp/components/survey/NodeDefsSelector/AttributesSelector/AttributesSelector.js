import './AttributesSelector.scss'

import React from 'react'
import * as PropTypes from 'prop-types'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import ExpansionPanel from '@webapp/components/expansionPanel'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'

import AttributeSelector from './AttributeSelector'

const AttributesSelector = (props) => {
  const {
    canSelectAttributes,
    filterFunction,
    filterTypes,
    filterChainUuids,
    lang,
    ancestorSelector,
    nodeDefLabelType,
    nodeDefUuidsToExclude,
    nodeDefUuidEntity,
    nodeDefUuidsAttributes,
    onToggleAttribute,
    showAnalysisAttributes,
    showAncestors,
    showAncestorsLabel,
    showLabel,
    showMultipleAttributes,
    showSiblingsInSingleEntities,
  } = props

  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const canUseAnalysis = useAuthCanUseAnalysis()

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidEntity)(survey)

  if (!nodeDefContext) return null

  const nodeDefAncestor = showSiblingsInSingleEntities
    ? Survey.getNodeDefAncestorMultipleEntity(nodeDefContext)(survey)
    : Survey.getNodeDefParent(nodeDefContext)(survey)

  let childDefs = []
  if (NodeDef.isEntity(nodeDefContext)) {
    const includeAnalysis = showAnalysisAttributes && canUseAnalysis
    if (showSiblingsInSingleEntities) {
      childDefs = Survey.getNodeDefDescendantsInSingleEntities({
        nodeDef: nodeDefContext,
        includeAnalysis,
        cycle,
        sorted: true,
        filterFn: (n) => NodeDef.isAttribute(n) && (showMultipleAttributes || NodeDef.isSingle(n)),
      })(survey)
    } else {
      childDefs = Survey.getNodeDefChildrenSorted({ nodeDef: nodeDefContext, cycle, includeAnalysis })(survey)
    }
  } else {
    childDefs = [nodeDefContext] // Multiple attribute
  }

  const isNodeDefVisible = (nodeDef) =>
    !nodeDefUuidsToExclude.includes(NodeDef.getUuid(nodeDef)) &&
    ((NodeDef.isAttribute(nodeDef) && (showMultipleAttributes || NodeDef.isSingle(nodeDef))) ||
      NodeDef.isEqual(nodeDef)(nodeDefContext)) &&
    NodeDef.getCycles(nodeDef).includes(cycle) &&
    (filterFunction === null || filterFunction(nodeDef)) &&
    (filterTypes.length === 0 || filterTypes.includes(NodeDef.getType(nodeDef))) &&
    (filterChainUuids.length === 0 ||
      !NodeDef.getChainUuid(nodeDef) ||
      filterChainUuids.includes(NodeDef.getChainUuid(nodeDef)))

  const visibleChildDefs = childDefs.filter(isNodeDefVisible)

  return (
    <div className={classNames('attributes-selector', { ancestor: ancestorSelector })}>
      {visibleChildDefs.length > 0 && (
        <ExpansionPanel buttonLabel={NodeDef.getLabel(nodeDefContext, lang)} showHeader={showLabel}>
          {visibleChildDefs.map((childDef) => (
            <AttributeSelector
              key={NodeDef.getUuid(childDef)}
              canSelectAttributes={canSelectAttributes}
              nodeDef={childDef}
              nodeDefUuidsAttributes={nodeDefUuidsAttributes}
              onToggleAttribute={onToggleAttribute}
              showNodeDefPath={!showAncestorsLabel}
              nodeDefLabelType={nodeDefLabelType}
            />
          ))}
        </ExpansionPanel>
      )}
      {showAncestors && nodeDefAncestor && (
        <AttributesSelector
          lang={lang}
          ancestorSelector
          nodeDefUuidEntity={NodeDef.getUuid(nodeDefAncestor)}
          nodeDefUuidsAttributes={nodeDefUuidsAttributes}
          nodeDefUuidsToExclude={[NodeDef.getUuid(nodeDefContext)]}
          onToggleAttribute={onToggleAttribute}
          filterFunction={filterFunction}
          filterTypes={filterTypes}
          filterChainUuids={filterChainUuids}
          canSelectAttributes={canSelectAttributes}
          showLabel={showAncestorsLabel}
          showAnalysisAttributes={showAnalysisAttributes}
          showAncestorsLabel={showAncestorsLabel}
          showMultipleAttributes={showMultipleAttributes}
          showSiblingsInSingleEntities={showSiblingsInSingleEntities}
          nodeDefLabelType={nodeDefLabelType}
        />
      )}
    </div>
  )
}

AttributesSelector.propTypes = {
  ancestorSelector: PropTypes.bool,
  canSelectAttributes: PropTypes.bool,
  filterFunction: PropTypes.func,
  filterTypes: PropTypes.array,
  filterChainUuids: PropTypes.array,
  lang: PropTypes.string.isRequired,
  nodeDefUuidEntity: PropTypes.string,
  nodeDefUuidsAttributes: PropTypes.array,
  nodeDefUuidsToExclude: PropTypes.array,
  onToggleAttribute: PropTypes.func.isRequired,
  showAncestors: PropTypes.bool,
  showLabel: PropTypes.bool,
  showAnalysisAttributes: PropTypes.bool,
  showAncestorsLabel: PropTypes.bool,
  showMultipleAttributes: PropTypes.bool,
  showSiblingsInSingleEntities: PropTypes.bool,
  nodeDefLabelType: PropTypes.string,
}

AttributesSelector.defaultProps = {
  ancestorSelector: false,
  canSelectAttributes: true,
  filterFunction: null,
  filterTypes: [],
  filterChainUuids: [],
  nodeDefUuidEntity: null,
  nodeDefUuidsAttributes: [],
  nodeDefUuidsToExclude: [],
  showAnalysisAttributes: false,
  showAncestors: true,
  showAncestorsLabel: true,
  showLabel: false,
  showMultipleAttributes: true,
  showSiblingsInSingleEntities: false,
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
}

export default AttributesSelector
