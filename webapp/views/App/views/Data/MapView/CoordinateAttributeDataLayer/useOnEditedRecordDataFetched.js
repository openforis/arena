import { useEffect } from 'react'

import { ColumnNodeDef, TableDataNodeDef } from '@common/model/db'
import { Query } from '@common/model/query'

import { convertDataToPoints } from './convertDataToPoints'

const _updateDataAndPoints = ({
  editedRecordItem,
  survey,
  nodeDefParent,
  attributeDef,
  state,
  editingRecordUuid,
  parentEntityColumn,
  dataUpdated,
  pointsUpdated,
}) => {
  const { data, pointIndexByDataIndex } = state

  const oldDataItemIndex = data.findIndex(
    (dataItem) =>
      dataItem[TableDataNodeDef.columnSet.recordUuid] === editingRecordUuid &&
      dataItem[parentEntityColumn.name] === editedRecordItem[parentEntityColumn.name]
  )
  if (oldDataItemIndex >= 0) {
    dataUpdated[oldDataItemIndex] = editedRecordItem
    const { points: pointsConverted } = convertDataToPoints({
      data: [editedRecordItem],
      attributeDef,
      nodeDefParent,
      survey,
    })
    const pointConverted = pointsConverted.length > 0 ? pointsConverted[0] : null
    if (pointConverted) {
      const pointIndex = pointIndexByDataIndex[oldDataItemIndex]
      if (pointIndex !== null) {
        pointsUpdated[pointIndex] = pointConverted
      }
    }
  }
}

export const useOnEditedRecordDataFetched = ({
  survey,
  attributeDef,
  nodeDefParent,
  editingRecordUuid,
  dataEditedRecord,
  state,
  setState,
}) => {
  const { data, points } = state

  // when edited record data has been fetched, update points
  useEffect(() => {
    if (dataEditedRecord?.length > 0) {
      const dataTable = new TableDataNodeDef(survey, nodeDefParent)
      const parentEntityColumn = new ColumnNodeDef(dataTable, nodeDefParent)

      // replace data with updated data; re-convert into only related items;
      const pointsUpdated = [...points]
      const dataUpdated = [...data]
      dataEditedRecord.forEach((editedRecordItem) => {
        _updateDataAndPoints({
          editedRecordItem,
          survey,
          nodeDefParent,
          attributeDef,
          state,
          editingRecordUuid,
          parentEntityColumn,
          dataUpdated,
          pointsUpdated,
        })
      }, [])

      setState((statePrev) => ({
        ...statePrev,
        data: dataUpdated,
        points: pointsUpdated,
        // clear edited record data fetch query to allow fetching data again on record updates
        editedRecordQuery: Query.create(),
      }))
    }
  }, [dataEditedRecord])
}
