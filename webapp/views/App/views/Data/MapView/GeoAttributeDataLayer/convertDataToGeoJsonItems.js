import { latLngBounds } from 'leaflet'

import { PointFactory } from '@openforis/arena-core'

import { ColumnNodeDef, TableDataNodeDef } from '@common/model/db'
import * as Survey from '@core/survey/survey'

import { ValueFormatter } from '@webapp/components/DataQuery'
import { GeoJsonUtils } from '@webapp/utils/geoJsonUtils'

export const convertDataToGeoJsonItems = ({ data, attributeDef, nodeDefParent, survey, i18n }) => {
  const dataTable = new TableDataNodeDef(survey, nodeDefParent)
  const attributeColumn = new ColumnNodeDef(dataTable, attributeDef)
  const parentEntityColumn = new ColumnNodeDef(dataTable, nodeDefParent)

  const ancestorsKeyAttributes = Survey.getNodeDefAncestorsKeyAttributes(attributeDef)(survey)
  const ancestorsKeysColumns = ancestorsKeyAttributes.map(
    (ancestorKeyAttribute) => new ColumnNodeDef(dataTable, ancestorKeyAttribute)
  )

  return data.reduce(
    (acc, dataItem, index) => {
      const geoJsonString = dataItem[attributeColumn.name]
      if (!geoJsonString) {
        acc.itemIndexByDataIndex[index] = null
        return acc
      }
      const geoJson = JSON.parse(geoJsonString)

      const recordUuid = dataItem[TableDataNodeDef.columnSet.recordUuid]
      const recordOwnerUuid = dataItem[TableDataNodeDef.columnSet.recordOwnerUuid]
      const parentUuid = dataItem[parentEntityColumn.name]
      const key = `${recordUuid}-${parentUuid}`
      const ancestorsKeys = ancestorsKeysColumns.map((column) => {
        const ancestorDef = column.nodeDef
        const rawValue = dataItem[column.name]
        const label = dataItem[`${column.name}_label`]
        return ValueFormatter.format({ value: rawValue, label, i18n, nodeDef: ancestorDef })
      })

      const centerPoint = GeoJsonUtils.centroid(geoJson.geometry)

      const item = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [centerPoint.y, centerPoint.x],
        },
        properties: {
          key,
          ancestorsKeys,
          parentUuid,
          recordUuid,
          recordOwnerUuid,
          point: PointFactory.createInstance({ x: centerPoint.x, y: centerPoint.y }),
          center: true,
          data: geoJson,
        },
      }

      acc.bounds.extend([centerPoint.y, centerPoint.x])
      acc.items.push(item)
      acc.itemIndexByDataIndex[index] = index

      return acc
    },
    {
      bounds: latLngBounds(), // keep track of the layer bounds to calculate its center and pan the map into it
      items: [],
      itemIndexByDataIndex: [], // data item converted into geojson item can be "null", keep track of it
      points: [],
    }
  )
}
