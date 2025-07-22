import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'
import * as StepVariable from '@common/analysis/stepVariable'

import { useSurvey } from '@webapp/store/survey'

import ExpansionPanel from '@webapp/components/expansionPanel'

import AttributesSelector from './AttributesSelector/AttributesSelector'
import EntitySelector from './EntitySelector'
import AttributeSelector from './AttributesSelector/AttributeSelector'

const PREV_CALCULATIONS_ENABLED = false
const getPrevCalculations = ({ nodeDefUuidEntity, survey }) => {
  const variablesPrevCalculations = []
  const currentEntity = Survey.getNodeDefByUuid(nodeDefUuidEntity)(survey)
  Survey.visitAncestorsAndSelf(currentEntity, (ancestorDef) => {
    if (NodeDef.getUuid(ancestorDef) === nodeDefUuidEntity) {
      return
    }
    const children = Survey.getNodeDefChildren(ancestorDef)(survey)
    const analysisChildren = children.filter(NodeDef.isAnalysis).map((object) => ({
      ...object,
      aggregate: Query.DEFAULT_AGGREGATE_FUNCTIONS.sum, // TODO_ADD_AGGREGATE_EXPRESSION
    }))
    variablesPrevCalculations.push(...analysisChildren)
  })(survey)
  return variablesPrevCalculations
}

const NodeDefsSelectorAggregate = (props) => {
  const {
    dimensions,
    measures,
    nodeDefLabelType = NodeDef.NodeDefLabelTypes.label,
    nodeDefUuidEntity = null,
    onChangeEntity,
    onChangeMeasures,
    onChangeDimensions,
    showAnalysisAttributes = false,
  } = props

  const survey = useSurvey()
  const hierarchy = Survey.getHierarchy(NodeDef.isEntity)(survey)

  const variablesPrevSteps = getPrevCalculations({ nodeDefUuidEntity, survey })

  const measuresNodeDefUuids = useMemo(() => Object.keys(measures), [measures])

  const onToggleMeasure = (nodeDefUuid) => {
    const measuresUpdate = { ...measures }
    if (measuresUpdate[nodeDefUuid]) {
      delete measuresUpdate[nodeDefUuid]
    } else {
      let aggregateFn
      const variablePrevStep = variablesPrevSteps.find((variable) => StepVariable.getUuid(variable) === nodeDefUuid)
      if (variablePrevStep) {
        const expr = Expression.fromString(StepVariable.getAggregate(variablePrevStep))
        aggregateFn = Expression.toSql(expr)
      } else {
        aggregateFn =
          nodeDefUuidEntity === nodeDefUuid
            ? Query.DEFAULT_AGGREGATE_FUNCTIONS.cnt
            : Query.DEFAULT_AGGREGATE_FUNCTIONS.sum
      }
      measuresUpdate[nodeDefUuid] = [aggregateFn]
    }
    onChangeMeasures(measuresUpdate)
  }

  const onToggleDimension = (nodeDefUuid) => {
    const dimensionsUpdate = dimensions.includes(nodeDefUuid)
      ? dimensions.filter((uuid) => uuid !== nodeDefUuid)
      : [...dimensions, nodeDefUuid]
    onChangeDimensions(dimensionsUpdate)
  }

  return (
    <div className="node-defs-selector">
      <EntitySelector
        hierarchy={hierarchy}
        nodeDefLabelType={nodeDefLabelType}
        nodeDefUuidEntity={nodeDefUuidEntity}
        onChange={onChangeEntity}
        showSingleEntities={false}
      />

      {nodeDefUuidEntity && (
        <>
          <ExpansionPanel buttonLabel="common.dimension" buttonLabelParams={{ count: 2 }}>
            <AttributesSelector
              onToggleAttribute={onToggleDimension}
              filterFunction={(nodeDef) =>
                NodeDef.isBoolean(nodeDef) ||
                NodeDef.isCode(nodeDef) ||
                NodeDef.isTaxon(nodeDef) ||
                NodeDef.isKey(nodeDef)
              }
              nodeDefLabelType={nodeDefLabelType}
              nodeDefUuidEntity={nodeDefUuidEntity}
              nodeDefUuidsAttributes={dimensions}
              showAnalysisAttributes={showAnalysisAttributes}
              showAncestorsLabel={false}
              showMultipleAttributes={false}
              showSiblingsInSingleEntities
            />
          </ExpansionPanel>

          <ExpansionPanel buttonLabel="common.measure" buttonLabelParams={{ count: 2 }}>
            <AttributesSelector
              filterTypes={[NodeDef.nodeDefType.decimal, NodeDef.nodeDefType.integer]}
              filterFunction={(nodeDef) => !NodeDef.isKey(nodeDef)}
              includeEntityFrequencySelector
              nodeDefLabelType={nodeDefLabelType}
              nodeDefUuidEntity={nodeDefUuidEntity}
              nodeDefUuidsAttributes={measuresNodeDefUuids}
              onToggleAttribute={onToggleMeasure}
              showAncestors={false}
              showMultipleAttributes={false}
              showAnalysisAttributes={showAnalysisAttributes}
            />
          </ExpansionPanel>

          {PREV_CALCULATIONS_ENABLED && variablesPrevSteps.length > 0 && (
            <ExpansionPanel buttonLabel="common.measurePrevSteps" buttonLabelParams={{ count: 2 }}>
              {variablesPrevSteps.map((variablePrevStep) => {
                const variableNodeDefUuid = StepVariable.getUuid(variablePrevStep)
                const childDef = Survey.getNodeDefByUuid(variableNodeDefUuid)(survey)
                return (
                  <AttributeSelector
                    key={variableNodeDefUuid}
                    nodeDef={childDef}
                    nodeDefLabelType={nodeDefLabelType}
                    nodeDefUuidsAttributes={measuresNodeDefUuids}
                    nodeDefContext={Survey.getNodeDefByUuid(nodeDefUuidEntity)(survey)}
                    onToggleAttribute={onToggleMeasure}
                  />
                )
              })}
            </ExpansionPanel>
          )}
        </>
      )}
    </div>
  )
}

NodeDefsSelectorAggregate.propTypes = {
  dimensions: PropTypes.arrayOf(String).isRequired,
  measures: PropTypes.object.isRequired,
  nodeDefLabelType: PropTypes.string,
  nodeDefUuidEntity: PropTypes.string,
  onChangeEntity: PropTypes.func.isRequired,
  onChangeMeasures: PropTypes.func.isRequired,
  onChangeDimensions: PropTypes.func.isRequired,
  showAnalysisAttributes: PropTypes.bool,
}

export default NodeDefsSelectorAggregate
