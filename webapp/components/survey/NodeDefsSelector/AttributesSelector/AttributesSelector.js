import './AttributesSelector.scss'
import React from 'react'
import * as PropTypes from 'prop-types'
import classNames from 'classnames'

import { Arrays } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import ExpansionPanel from '@webapp/components/expansionPanel'
import { Checkbox } from '@webapp/components/form'
import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import AttributeSelector from './AttributeSelector'
import { AttributesList } from './AttributesList'

const minDefsToShowSelectAll = 5

const AttributesSelector = (props) => {
  const {
    ancestorSelector = false,
    canSelectAttributes = true,
    filterFunction = null,
    filterTypes = [],
    filterChainUuids = [],
    includeEntityFrequencySelector = false,
    nodeDefLabelType = NodeDef.NodeDefLabelTypes.label,
    nodeDefUuidEntity = null,
    nodeDefUuidsAttributes = [],
    nodeDefUuidsToExclude = [],
    onAttributesSelection,
    onToggleAttribute,
    showAnalysisAttributes = false,
    showAncestors = true,
    showAncestorsLabel = true,
    showLabel = false,
    showMultipleAttributes = true,
    showSiblingsInSingleEntities = false,
  } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
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
  const visibleChildDefUuids = visibleChildDefs.map(NodeDef.getUuid)
  const selectedCount = Arrays.intersection(visibleChildDefUuids, nodeDefUuidsAttributes).length
  const allSelected = selectedCount === visibleChildDefUuids.length
  const allSelectionIndeterminate = selectedCount > 0 && !allSelected

  const onSelectAll = (selected) => onAttributesSelection({ attributeDefUuids: visibleChildDefUuids, selected })

  return (
    <div className={classNames('attributes-selector', { ancestor: ancestorSelector })}>
      {includeEntityFrequencySelector && (
        <AttributeSelector
          key={NodeDef.getUuid(nodeDefAncestor)}
          labelFunction={(nodeDef) =>
            i18n.t('dataView.nodeDefsSelector.nodeDefFrequency', {
              nodeDefLabel: NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType }),
            })
          }
          nodeDef={nodeDefContext}
          nodeDefUuidsAttributes={nodeDefUuidsAttributes}
          onToggleAttribute={onToggleAttribute}
          showNodeDefPath={false}
          nodeDefLabelType={nodeDefLabelType}
        />
      )}
      {visibleChildDefs.length > 0 && (
        <ExpansionPanel buttonLabel={NodeDef.getLabel(nodeDefContext, lang)} showHeader={showLabel}>
          {onAttributesSelection && visibleChildDefs.length > minDefsToShowSelectAll && (
            <Checkbox
              checked={allSelected}
              indeterminate={allSelectionIndeterminate}
              label="common.selectAll"
              onChange={onSelectAll}
            />
          )}
          <AttributesList
            attributeDefs={visibleChildDefs}
            canSelectAttributes={canSelectAttributes}
            nodeDefContext={nodeDefContext}
            nodeDefLabelType={nodeDefLabelType}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            onToggleAttribute={onToggleAttribute}
            showAncestorsLabel={showAncestorsLabel}
          />
        </ExpansionPanel>
      )}
      {showAncestors && nodeDefAncestor && (
        <AttributesSelector
          ancestorSelector
          canSelectAttributes={canSelectAttributes}
          filterChainUuids={filterChainUuids}
          filterFunction={filterFunction}
          filterTypes={filterTypes}
          nodeDefLabelType={nodeDefLabelType}
          nodeDefUuidEntity={NodeDef.getUuid(nodeDefAncestor)}
          nodeDefUuidsAttributes={nodeDefUuidsAttributes}
          nodeDefUuidsToExclude={[NodeDef.getUuid(nodeDefContext)]}
          onAttributesSelection={onAttributesSelection}
          onToggleAttribute={onToggleAttribute}
          showAnalysisAttributes={showAnalysisAttributes}
          showAncestorsLabel={showAncestorsLabel}
          showLabel={showAncestorsLabel}
          showMultipleAttributes={showMultipleAttributes}
          showSiblingsInSingleEntities={showSiblingsInSingleEntities}
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
  includeEntityFrequencySelector: PropTypes.bool,
  nodeDefUuidEntity: PropTypes.string,
  nodeDefUuidsAttributes: PropTypes.array,
  nodeDefUuidsToExclude: PropTypes.array,
  onAttributesSelection: PropTypes.func,
  onToggleAttribute: PropTypes.func.isRequired,
  showAncestors: PropTypes.bool,
  showLabel: PropTypes.bool,
  showAnalysisAttributes: PropTypes.bool,
  showAncestorsLabel: PropTypes.bool,
  showMultipleAttributes: PropTypes.bool,
  showSiblingsInSingleEntities: PropTypes.bool,
  nodeDefLabelType: PropTypes.string,
}

export default AttributesSelector
