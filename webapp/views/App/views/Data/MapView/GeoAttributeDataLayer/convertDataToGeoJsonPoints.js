import { latLngBounds } from 'leaflet'

import { PointFactory, Points } from '@openforis/arena-core'

import { ColumnNodeDef, TableDataNodeDef } from '@common/model/db'
import { DataQueryValueFormatter } from '@common/analysis/dataQueryValueFormatter'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'
import { GeoJsonUtils } from '@core/geo/geoJsonUtils'

const extractCommonProperties = ({ dataItem, parentEntityColumn, ancestorsKeysColumns, i18n }) => {
  const recordUuid = dataItem[TableDataNodeDef.columnSet.recordUuid]
  const recordOwnerUuid = dataItem[TableDataNodeDef.columnSet.recordOwnerUuid]
  const parentUuid = dataItem[parentEntityColumn.name]
  const key = `${recordUuid}-${parentUuid}`
  const ancestorsKeys = ancestorsKeysColumns.map((column) =>
    DataQueryValueFormatter.formatDataItemKey({ i18n, nodeDef: column.nodeDef, dataItem })
  )

  return {
    key,
    ancestorsKeys,
    parentUuid,
    recordUuid,
    recordOwnerUuid,
    center: true,
  }
}

const pointExtractorByNodeDefType = {
  [NodeDef.nodeDefType.coordinate]: ({ attributeValue, srsIndex }) => {
    const locationStr = StringUtils.prependIfMissing('SRID=')(attributeValue)
    const point = Points.parse(locationStr)
    const pointLatLong = point ? Points.toLatLong(point, srsIndex) : null
    return { point: pointLatLong }
  },
  [NodeDef.nodeDefType.geo]: ({ attributeValue }) => {
    const geoJson = JSON.parse(attributeValue)
    const point = GeoJsonUtils.centroidPoint(geoJson)
    return { point, properties: { data: geoJson } }
  },
}

const extractPointAndExtraPropertiesFromAttributeValue = ({ attributeDef, attributeValue, srsIndex }) =>
  pointExtractorByNodeDefType[NodeDef.getType(attributeDef)]({ attributeDef, attributeValue, srsIndex })

export const convertDataToGeoJsonPoints = ({ data, attributeDef, nodeDefParent, survey, i18n }) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const srsIndex = Survey.getSRSIndex(surveyInfo)

  const dataTable = new TableDataNodeDef(survey, nodeDefParent)
  const attributeColumn = new ColumnNodeDef(dataTable, attributeDef)
  const parentEntityColumn = new ColumnNodeDef(dataTable, nodeDefParent)

  const ancestorsKeyAttributes = Survey.getNodeDefAncestorsKeyAttributes(attributeDef)(survey)
  const ancestorsKeysColumns = ancestorsKeyAttributes.map(
    (ancestorKeyAttribute) => new ColumnNodeDef(dataTable, ancestorKeyAttribute)
  )

  return data.reduce(
    (acc, dataItem, index) => {
      const attributeValue = dataItem[attributeColumn.name]
      if (!attributeValue) return acc

      const { point, properties: extraProperties = {} } = extractPointAndExtraPropertiesFromAttributeValue({
        attributeDef,
        attributeValue,
        srsIndex,
      })

      if (!point) return acc

      const { x, y } = point

      const properties = {
        ...extractCommonProperties({ dataItem, parentEntityColumn, ancestorsKeysColumns, i18n }),
        point: PointFactory.createInstance({ x, y }),
        ...extraProperties,
      }

      const pointFeature = GeoJsonUtils.createPointFeature({ x, y, properties })

      acc.bounds.extend([point.y, point.x])
      acc.points.push(pointFeature)
      acc.pointIndexByDataIndex[index] = acc.points.length - 1

      return acc
    },
    {
      bounds: latLngBounds(), // keep track of the layer bounds to calculate its center and pan the map into it
      points: [],
      pointIndexByDataIndex: [], // data item converted into geojson item can be "null", keep track of it
    }
  )
}
