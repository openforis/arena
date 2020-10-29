import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'
import * as StepVariable from '@common/analysis/stepVariable'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyLang } from '@webapp/store/survey'

import { useRequest } from '@webapp/components/hooks'
import ExpansionPanel from '@webapp/components/expansionPanel'

import AttributesSelector from './AttributesSelector/AttributesSelector'
import EntitySelector from './EntitySelector'
import AttributeSelector from './AttributesSelector/AttributeSelector'

const NodeDefsSelectorAggregate = (props) => {
  const { dimensions, measures, nodeDefUuidEntity, onChangeEntity, onChangeMeasures, onChangeDimensions } = props

  const survey = useSurvey()
  const lang = useSurveyLang()
  const hierarchy = Survey.getHierarchy(NodeDef.isEntity, true)(survey)

  const variablesPrevSteps = useRequest({
    defaultValue: [],
    dependencies: [nodeDefUuidEntity],
    requestFunction: API.fetchVariablesPrevSteps,
    requestArguments: [{ surveyId: Survey.getId(survey), entityUuid: nodeDefUuidEntity }],
  })

  const onToggleMeasure = (nodeDefUuid) => {
    const measuresUpdate = new Map(measures)
    if (measuresUpdate.has(nodeDefUuid)) {
      measuresUpdate.delete(nodeDefUuid)
    } else {
      let aggregateFn
      const variablePrevStep = variablesPrevSteps.find((variable) => StepVariable.getUuid(variable) === nodeDefUuid)
      if (variablePrevStep) {
        const expr = Expression.fromString(StepVariable.getAggregate(variablePrevStep))
        aggregateFn = Expression.toSql(expr)
      } else {
        aggregateFn = Query.aggregateFunctions.sum
      }
      measuresUpdate.set(nodeDefUuid, [aggregateFn])
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
        lang={lang}
        nodeDefUuidEntity={nodeDefUuidEntity}
        onChange={onChangeEntity}
      />

      {nodeDefUuidEntity && (
        <>
          <ExpansionPanel buttonLabel="common.dimension" buttonLabelParams={{ count: 2 }}>
            <AttributesSelector
              onToggleAttribute={onToggleDimension}
              lang={lang}
              filterTypes={[NodeDef.nodeDefType.code]}
              nodeDefUuidEntity={nodeDefUuidEntity}
              nodeDefUuidsAttributes={dimensions}
              showAncestorsLabel={false}
              showMultipleAttributes={false}
            />
          </ExpansionPanel>

          <ExpansionPanel buttonLabel="common.measure" buttonLabelParams={{ count: 2 }}>
            <AttributesSelector
              onToggleAttribute={onToggleMeasure}
              lang={lang}
              filterTypes={[NodeDef.nodeDefType.decimal, NodeDef.nodeDefType.integer]}
              nodeDefUuidEntity={nodeDefUuidEntity}
              nodeDefUuidsAttributes={[...measures.keys()]}
              showAncestors={false}
              showMultipleAttributes={false}
            />
          </ExpansionPanel>
          {variablesPrevSteps.length && (
            <ExpansionPanel buttonLabel="common.measurePrevSteps" buttonLabelParams={{ count: 2 }}>
              {variablesPrevSteps.map((variablePrevStep) => {
                const variableNodeDefUuid = StepVariable.getUuid(variablePrevStep)
                const childDef = Survey.getNodeDefByUuid(variableNodeDefUuid)(survey)
                return (
                  <AttributeSelector
                    key={variableNodeDefUuid}
                    lang={lang}
                    nodeDef={childDef}
                    nodeDefUuidsAttributes={[...measures.keys()]}
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
  measures: PropTypes.instanceOf(Map).isRequired,
  nodeDefUuidEntity: PropTypes.string,
  onChangeEntity: PropTypes.func.isRequired,
  onChangeMeasures: PropTypes.func.isRequired,
  onChangeDimensions: PropTypes.func.isRequired,
}

NodeDefsSelectorAggregate.defaultProps = {
  nodeDefUuidEntity: null,
}

export default NodeDefsSelectorAggregate
