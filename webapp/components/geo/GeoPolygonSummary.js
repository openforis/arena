import './GeoPolygonSummary.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '../form/Input'
import { GeoJsonUtils } from '@webapp/utils/geoJsonUtils'

export const GeoPolygonSummary = (props) => {
  const { geoJson } = props

  const polygon = geoJson.geometry

  const i18n = useI18n()

  return (
    <div className="geo-polygon-summary">
      <FormItem label={i18n.t('geo.vertices')}>{GeoJsonUtils.countVertices(polygon)}</FormItem>
      <FormItem label={i18n.t('geo.area')}>{GeoJsonUtils.area(polygon)} m²</FormItem>
      <FormItem label={i18n.t('geo.perimeter')}>{GeoJsonUtils.perimeter(polygon)} m</FormItem>
    </div>
  )
}

GeoPolygonSummary.propTypes = {
  geoJson: PropTypes.object.isRequired,
}
