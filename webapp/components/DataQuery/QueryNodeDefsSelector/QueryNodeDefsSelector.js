import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { useSurvey } from '@webapp/store/survey'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'

import { NodeDefsSelectorAggregate, NodeDefsSelector } from '@webapp/components/survey/NodeDefsSelector'
import { DataExplorerHooks } from '@webapp/store/dataExplorer'
import { DataExplorerSelectors } from '@webapp/store/dataExplorer/selectors'

const QueryNodeDefsSelector = (props) => {
  const { nodeDefLabelType } = props

  const query = DataExplorerSelectors.useQuery()

  const survey = useSurvey()
  const hierarchy = Survey.getHierarchy(NodeDef.isEntityOrMultiple)(survey)

  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const onChangeEntity = useCallback((entityDefUuid) => onChangeQuery(Query.create({ entityDefUuid })), [onChangeQuery])

  return Query.isModeAggregate(query) ? (
    <NodeDefsSelectorAggregate
      nodeDefLabelType={nodeDefLabelType}
      nodeDefUuidEntity={Query.getEntityDefUuid(query)}
      dimensions={Query.getDimensions(query)}
      measures={Query.getMeasures(query)}
      onChangeEntity={onChangeEntity}
      onChangeMeasures={(measuresUpdate) => onChangeQuery(Query.assocMeasures(measuresUpdate)(query))}
      onChangeDimensions={(dimensionsUpdate) => onChangeQuery(Query.assocDimensions(dimensionsUpdate)(query))}
      showAnalysisAttributes
    />
  ) : (
    <NodeDefsSelector
      hierarchy={hierarchy}
      nodeDefLabelType={nodeDefLabelType}
      nodeDefUuidEntity={Query.getEntityDefUuid(query)}
      nodeDefUuidsAttributes={Query.getAttributeDefUuids(query)}
      onChangeEntity={onChangeEntity}
      onChangeAttributes={(nodeDefUuidsAttributesUpdated) =>
        onChangeQuery(Query.assocAttributeDefUuids(nodeDefUuidsAttributesUpdated)(query))
      }
      showAnalysisAttributes
    />
  )
}

QueryNodeDefsSelector.propTypes = {
  nodeDefLabelType: PropTypes.string,
}

QueryNodeDefsSelector.defaultProps = {
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
}

export default QueryNodeDefsSelector
