import './GeoPolygonSummary.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as NumberUtils from '@core/numberUtils'
import { useI18n } from '@webapp/store/system'
import { FormItem } from '../form/Input'
import { GeoJsonUtils } from '@webapp/utils/geoJsonUtils'

const round = (value, precision = 2) => NumberUtils.roundToPrecision(value, precision)

export const GeoPolygonSummary = (props) => {
  const { geoJson } = props

  const polygon = geoJson.geometry

  const i18n = useI18n()

  const areaInSquareMeters = GeoJsonUtils.area(geoJson)
  const areaInSquareFeet = NumberUtils.squareMetersToSquareFeet(areaInSquareMeters)
  const perimeterInMeters = GeoJsonUtils.perimeter(geoJson)
  const perimeterInFeet = NumberUtils.metersToFeet(perimeterInMeters)

  return (
    <div className="geo-polygon-summary">
      <FormItem label={i18n.t('geo.vertices')}>{GeoJsonUtils.countVertices(polygon)}</FormItem>
      <FormItem label={i18n.t('geo.area')}>
        {round(areaInSquareMeters)}m² ({round(areaInSquareFeet)}ft²)
      </FormItem>
      <FormItem label={i18n.t('geo.perimeter')}>
        {round(perimeterInMeters)}m ({round(perimeterInFeet)}ft)
      </FormItem>
    </div>
  )
}

GeoPolygonSummary.propTypes = {
  geoJson: PropTypes.object.isRequired,
}
