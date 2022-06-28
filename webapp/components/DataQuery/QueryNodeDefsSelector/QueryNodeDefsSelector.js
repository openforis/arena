import React from 'react'
import PropTypes from 'prop-types'

import { useSurvey } from '@webapp/store/survey'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'

import { NodeDefsSelectorAggregate, NodeDefsSelector } from '@webapp/components/survey/NodeDefsSelector'

const QueryNodeDefsSelector = (props) => {
  const { query, onChangeQuery } = props

  const survey = useSurvey()
  const hierarchy = Survey.getHierarchy(NodeDef.isEntityOrMultiple)(survey)
  const onChangeEntity = (entityDefUuid) => onChangeQuery(Query.create({ entityDefUuid }))

  return Query.isModeAggregate(query) ? (
    <NodeDefsSelectorAggregate
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
    />
  ) : (
    <NodeDefsSelector
      hierarchy={hierarchy}
      nodeDefUuidEntity={Query.getEntityDefUuid(query)}
      nodeDefUuidsAttributes={Query.getAttributeDefUuids(query)}
      onChangeEntity={onChangeEntity}
      onChangeAttributes={(nodeDefUuidsAttributesUpdated) => {
        onChangeQuery(Query.assocAttributeDefUuids(nodeDefUuidsAttributesUpdated)(query))
      }}
      showAnalysisAttributes
      showMultipleAttributes={false}
    />
  )
}

QueryNodeDefsSelector.propTypes = {
  query: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
}

export default QueryNodeDefsSelector
