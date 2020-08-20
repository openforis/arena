import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'

import { useSurvey, useSurveyLang } from '@webapp/store/survey'

import ExpansionPanel from '@webapp/components/expansionPanel'

import AttributesSelector from './AttributesSelector/AttributesSelector'
import EntitySelector from './EntitySelector'

const NodeDefsSelectorAggregate = (props) => {
  const { dimensions, measures, nodeDefUuidEntity, onChangeEntity, onChangeMeasures, onChangeDimensions } = props

  const survey = useSurvey()
  const lang = useSurveyLang()
  const hierarchy = Survey.getHierarchy(NodeDef.isEntity, true)(survey)

  const onToggleMeasure = (nodeDefUuid) => {
    const measuresUpdate = new Map(measures)
    if (measuresUpdate.has(nodeDefUuid)) measuresUpdate.delete(nodeDefUuid)
    else measuresUpdate.set(nodeDefUuid, [Query.aggregateFunctions.sum])

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
              showAncestorsLabel={false}
              showMultipleAttributes={false}
            />
          </ExpansionPanel>
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
