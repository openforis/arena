import './AttributesSelector.scss'
import React from 'react'
import * as PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/store/survey'

import ExpansionPanel from '@webapp/components/expansionPanel'
import AttributeSelector from './AttributeSelector'
import { useAuthCanUseAnalysis } from '@webapp/store/user'

const AttributesSelector = (props) => {
  const {
    canSelectAttributes,
    filterFunction,
    filterTypes,
    filterChainUuids,
    lang,
    nodeDefUuidEntity,
    nodeDefUuidsAttributes,
    onToggleAttribute,
    showAnalysisAttributes,
    showAncestors,
    showAncestorsLabel,
    showLabel,
    showMultipleAttributes,
    showSiblingsInSingleEntities,
    nodeDefLabelType,
  } = props

  const survey = useSurvey()
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
      childDefs = Survey.getNodeDefDescendantAttributesInSingleEntities(nodeDefContext, includeAnalysis)(survey)
    } else {
      childDefs = Survey.getNodeDefChildren(nodeDefContext, includeAnalysis)(survey)
    }
  } else {
    childDefs = [nodeDefContext] // Multiple attribute
  }

  return (
    <div className="attributes-selector">
      <ExpansionPanel buttonLabel={NodeDef.getLabel(nodeDefContext, lang)} showHeader={showLabel}>
        {childDefs.map((childDef) => (
          <AttributeSelector
            key={NodeDef.getUuid(childDef)}
            canSelectAttributes={canSelectAttributes}
            filterFunction={filterFunction}
            filterTypes={filterTypes}
            filterChainUuids={filterChainUuids}
            nodeDef={childDef}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            nodeDefContext={nodeDefContext}
            onToggleAttribute={onToggleAttribute}
            showMultipleAttributes={showMultipleAttributes}
            showNodeDefPath={!showAncestorsLabel}
            nodeDefLabelType={nodeDefLabelType}
          />
        ))}
      </ExpansionPanel>

      {showAncestors && nodeDefAncestor && (
        <AttributesSelector
          lang={lang}
          nodeDefUuidEntity={NodeDef.getUuid(nodeDefAncestor)}
          nodeDefUuidsAttributes={nodeDefUuidsAttributes}
          onToggleAttribute={onToggleAttribute}
          filterFunction={filterFunction}
          filterTypes={filterTypes}
          filterChainUuids={filterChainUuids}
          canSelectAttributes={canSelectAttributes}
          showLabel={showAncestorsLabel}
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
  canSelectAttributes: PropTypes.bool,
  filterFunction: PropTypes.func,
  filterTypes: PropTypes.array,
  filterChainUuids: PropTypes.array,
  lang: PropTypes.string.isRequired,
  nodeDefUuidEntity: PropTypes.string,
  nodeDefUuidsAttributes: PropTypes.array,
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
  canSelectAttributes: true,
  filterFunction: null,
  filterTypes: [],
  filterChainUuids: [],
  nodeDefUuidEntity: null,
  nodeDefUuidsAttributes: [],
  showAnalysisAttributes: false,
  showAncestors: true,
  showAncestorsLabel: true,
  showLabel: false,
  showMultipleAttributes: true,
  showSiblingsInSingleEntities: false,
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
}

export default AttributesSelector
