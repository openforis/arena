import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { Query } from '@common/model/query'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'

import { DataQuerySortableItems } from './DataQuerySortableItems'

export const DataQuerySelectedMeasures = (props) => {
  const { nodeDefLabelType } = props

  const query = DataExplorerSelectors.useQuery()
  const measures = Query.getMeasures(query)
  const measuresDefUuids = Object.keys(measures)
  const onChangeQuery = DataExplorerHooks.useSetQuery()

  const onMeasuresUpdate = useCallback(
    (measuresUpdated) => {
      onChangeQuery(Query.assocMeasures(measuresUpdated)(query))
    },
    [onChangeQuery, query]
  )

  const onMeasuresSort = useCallback(
    (sortedMeasuresDefs) => {
      const measuresUpdated = sortedMeasuresDefs.reduce((acc, measureDef) => {
        const measureDefUuid = NodeDef.getUuid(measureDef)
        acc[measureDefUuid] = measures[measureDefUuid]
        return acc
      }, {})
      onMeasuresUpdate(measuresUpdated)
    },
    [measures, onMeasuresUpdate]
  )

  const onMeasureDelete = useCallback(
    (measureDef) => {
      const measuresUpdated = { ...measures }
      delete measuresUpdated[NodeDef.getUuid(measureDef)]
      onMeasuresUpdate(measuresUpdated)
    },
    [measures, onMeasuresUpdate]
  )

  return (
    <DataQuerySortableItems
      attributeDefUuids={measuresDefUuids}
      label="common.measure_other"
      nodeDefLabelType={nodeDefLabelType}
      onItemDelete={onMeasureDelete}
      onItemsSort={onMeasuresSort}
    />
  )
}

DataQuerySelectedMeasures.propTypes = {
  nodeDefLabelType: PropTypes.string,
}
