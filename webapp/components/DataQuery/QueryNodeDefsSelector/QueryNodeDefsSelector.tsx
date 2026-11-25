import { useCallback } from 'react'

import { Query } from '@common/model/query'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { NodeDefsSelector, NodeDefsSelectorAggregate } from '@webapp/components/survey/NodeDefsSelector'
import { DataExplorerHooks } from '@webapp/store/dataExplorer'
import { DataExplorerSelectors } from '@webapp/store/dataExplorer/selectors'
import { useSurvey } from '@webapp/store/survey'

type QueryNodeDefsSelectorProps = {
  nodeDefLabelType?: NodeDef.NodeDefLabelType
}

const QueryNodeDefsSelector = (props: QueryNodeDefsSelectorProps) => {
  const { nodeDefLabelType = NodeDef.NodeDefLabelTypes.label } = props

  const query = DataExplorerSelectors.useQuery()
  const modeAggregate = Query.isModeAggregate(query)

  const survey = useSurvey()
  const hierarchy = Survey.getHierarchy(NodeDef.isEntityOrMultiple)(survey)

  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const onChangeEntity = useCallback(
    (entityDefUuid) => {
      let newQuery = Query.create({ entityDefUuid })
      if (modeAggregate) {
        newQuery = Query.assocMode(Query.modes.aggregate)(newQuery)
      }
      onChangeQuery(newQuery)
    },
    [modeAggregate, onChangeQuery]
  )

  return modeAggregate ? (
    <NodeDefsSelectorAggregate
      nodeDefLabelType={nodeDefLabelType}
      nodeDefUuidEntity={Query.getEntityDefUuid(query)}
      dimensions={Query.getDimensions(query)}
      measures={Query.getMeasures(query)}
      onChangeEntity={onChangeEntity}
      onChangeMeasures={(measuresUpdate) => onChangeQuery(Query.assocMeasures(measuresUpdate)(query))}
      onChangeDimensions={(dimensionsUpdate) => onChangeQuery(Query.assocDimensions(dimensionsUpdate)(query))}
      showAnalysisAttributes
      showSearch
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
      showSearch
    />
  )
}

export default QueryNodeDefsSelector
