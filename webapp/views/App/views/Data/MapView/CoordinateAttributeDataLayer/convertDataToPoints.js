import { latLngBounds } from 'leaflet'

import { Points } from '@openforis/arena-core'

import { ColumnNodeDef, TableDataNodeDef } from '@common/model/db'

export const convertDataToPoints = ({ data, attributeDef, nodeDefParent, survey }) => {
  const dataTable = new TableDataNodeDef(survey, nodeDefParent)
  const attributeColumn = new ColumnNodeDef(dataTable, attributeDef)
  const parentEntityColumn = new ColumnNodeDef(dataTable, nodeDefParent)

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

      acc.points.push({
        type: 'Feature',
        properties: { key, cluster: false, point, recordUuid, parentUuid, location },
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
