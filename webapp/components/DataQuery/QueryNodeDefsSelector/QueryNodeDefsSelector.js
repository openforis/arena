import React from 'react'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { NodeDefsSelector, NodeDefsSelectorAggregate } from '@webapp/components/survey/NodeDefsSelector'
import { useSurvey } from '@webapp/store/survey'

const QueryNodeDefsSelector = (props) => {
  const { nodeDefLabelType, query, onChangeQuery } = props

  const survey = useSurvey()
  const hierarchy = Survey.getHierarchy(NodeDef.isEntityOrMultiple)(survey)
  const onChangeEntity = (entityDefUuid) => onChangeQuery(Query.create({ entityDefUuid }))

  return Query.isModeAggregate(query) ? (
    <NodeDefsSelectorAggregate
      nodeDefLabelType={nodeDefLabelType}
      nodeDefUuidEntity={Query.getEntityDefUuid(query)}
      dimensions={Query.getDimensions(query)}
      measures={Query.getMeasures(query)}
      onChangeEntity={onChangeEntity}
      onChangeMeasures={(measuresUpdate) => {
        onChangeQuery(Query.assocMeasures(measuresUpdate)(query))
      }}
      onChangeDimensions={(dimensionsUpdate) => {
        onChangeQuery(Query.assocDimensions(dimensionsUpdate)(query))
      }}
      showAnalysisAttributes
    />
  ) : (
    <NodeDefsSelector
      hierarchy={hierarchy}
      nodeDefLabelType={nodeDefLabelType}
      nodeDefUuidEntity={Query.getEntityDefUuid(query)}
      nodeDefUuidsAttributes={Query.getAttributeDefUuids(query)}
      onChangeEntity={onChangeEntity}
      onChangeAttributes={(nodeDefUuidsAttributesUpdated) => {
        onChangeQuery(Query.assocAttributeDefUuids(nodeDefUuidsAttributesUpdated)(query))
      }}
      showAnalysisAttributes
    />
  )
}

QueryNodeDefsSelector.propTypes = {
  nodeDefLabelType: PropTypes.string,
  query: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
}

QueryNodeDefsSelector.defaultProps = {
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
}

export default QueryNodeDefsSelector
