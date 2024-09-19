import { latLngBounds } from 'leaflet'

import * as Survey from '@core/survey/survey'

import { ColumnNodeDef, TableDataNodeDef } from '@common/model/db'

import { ValueFormatter } from '@webapp/components/DataQuery'

export const convertDataToGeoJsonItems = ({ data, attributeDef, nodeDefParent, survey, i18n }) => {
  const dataTable = new TableDataNodeDef(survey, nodeDefParent)
  const attributeColumn = new ColumnNodeDef(dataTable, attributeDef)
  const parentEntityColumn = new ColumnNodeDef(dataTable, nodeDefParent)

  const ancestorsKeyAttributes = Survey.getNodeDefAncestorsKeyAttributes(attributeDef)(survey)
  const ancestorsKeysColumns = ancestorsKeyAttributes.map(
    (ancestorKeyAttribute) => new ColumnNodeDef(dataTable, ancestorKeyAttribute)
  )

  return data.reduce(
    (acc, item, index) => {
      const geoJson = item[attributeColumn.name]
      if (!geoJson) {
        acc.itemIndexByDataIndex[index] = null
        return acc
      }

      const recordUuid = item[TableDataNodeDef.columnSet.recordUuid]
      const recordOwnerUuid = item[TableDataNodeDef.columnSet.recordOwnerUuid]
      const parentUuid = item[parentEntityColumn.name]
      const key = `${recordUuid}-${parentUuid}`
      const ancestorsKeys = ancestorsKeysColumns.map((column) => {
        const ancestorDef = column.nodeDef
        const rawValue = item[column.name]
        const label = item[`${column.name}_label`]
        return ValueFormatter.format({ value: rawValue, label, i18n, nodeDef: ancestorDef })
      })

      acc.items.push({
        ...geoJson,
        properties: {
          key,
          recordUuid,
          recordOwnerUuid,
          parentUuid,
          ancestorsKeys,
        },
      })
      acc.itemIndexByDataIndex[index] = index

      return acc
    },
    {
      items: [],
      itemIndexByDataIndex: [], // data item converted into geojson item can be "null", keep track of it
      bounds: latLngBounds(), // keep track of the layer bounds to calculate its center and pan the map into it
    }
  )
}
