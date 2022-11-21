import { latLngBounds } from 'leaflet'

import { Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

import { ColumnNodeDef, TableDataNodeDef } from '@common/model/db'

import { ValueFormatter } from '@webapp/components/DataQuery'

export const convertDataToPoints = ({ data, attributeDef, nodeDefParent, survey, i18n }) => {
  const dataTable = new TableDataNodeDef(survey, nodeDefParent)
  const attributeColumn = new ColumnNodeDef(dataTable, attributeDef)
  const parentEntityColumn = new ColumnNodeDef(dataTable, nodeDefParent)

  const ancestorsKeyAttributes = Survey.getNodeDefAncestorsKeyAttributes(attributeDef)(survey)
  const ancestorsKeysColumns = ancestorsKeyAttributes.map(
    (ancestorKeyAttribute) => new ColumnNodeDef(dataTable, ancestorKeyAttribute)
  )

  return data.reduce(
    (acc, item, index) => {
      const location = item[attributeColumn.name]
      if (!location) {
        acc.pointIndexByDataIndex[index] = null
        return acc
      }

      // workaraound: prepend SRID= to location if not specified
      const locationStr = location.startsWith('SRID=') ? location : `SRID=${location}`
      const point = Points.parse(locationStr)
      const pointLatLong = point ? Points.toLatLong(point) : null
      if (!pointLatLong) {
        // location is not valid, cannot convert it to lat-lon
        acc.pointIndexByDataIndex[index] = null
        return acc
      }

      const { x: long, y: lat } = pointLatLong

      acc.bounds.extend([lat, long])

      const recordUuid = item[TableDataNodeDef.columnSet.recordUuid]
      const parentUuid = item[parentEntityColumn.name]
      const key = `${recordUuid}-${parentUuid}`
      const ancestorsKeys = ancestorsKeysColumns.map((column) => {
        const ancestorDef = column.nodeDef
        const rawValue = item[column.name]
        return ValueFormatter.format({ value: rawValue, i18n, nodeDef: ancestorDef })
      })

      acc.points.push({
        type: 'Feature',
        properties: { key, cluster: false, point, recordUuid, parentUuid, location, ancestorsKeys },
        geometry: {
          type: 'Point',
          coordinates: [long, lat],
        },
      })
      acc.pointIndexByDataIndex[index] = index

      return acc
    },
    {
      points: [],
      pointIndexByDataIndex: [], // data item converted into a point can be "null", keep track of it
      bounds: latLngBounds(), // keep track of the layer bounds to calculate its center and pan the map into it
    }
  )
}
