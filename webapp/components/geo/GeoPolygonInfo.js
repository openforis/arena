import './GeoPolygonInfo.scss'

import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as NumberUtils from '@core/numberUtils'

import { useI18n } from '@webapp/store/system'
import { GeoJsonUtils } from '@webapp/utils/geoJsonUtils'

import { FormItem } from '../form/Input'
import { ButtonIconInfo } from '../buttons'

const {
  abbreviationByUnit,
  areaUnits,
  formatDecimal,
  lengthUnits,
  metersToUnit,
  roundToPrecision,
  squareMetersToUnit,
} = NumberUtils

const formatNumber = (value) => formatDecimal(roundToPrecision(value, 2))

export const GeoPolygonInfo = (props) => {
  const { geoJson } = props

  const i18n = useI18n()

  const areaInSquareMeters = GeoJsonUtils.area(geoJson)
  const perimeterInMeters = GeoJsonUtils.perimeter(geoJson)

  const areaInUnit = useCallback(
    (unit) => `${formatNumber(squareMetersToUnit(unit)(areaInSquareMeters))} ${abbreviationByUnit[unit]}`,
    [areaInSquareMeters]
  )

  const areaTooltipContent = useMemo(
    () => [areaUnits.squareMeter, areaUnits.squareFoot, areaUnits.acre].map(areaInUnit).join('<br>'),
    [areaInUnit]
  )

  const perimeterInUnit = useCallback(
    (unit) => `${formatNumber(metersToUnit(unit)(perimeterInMeters))} ${abbreviationByUnit[unit]}`,
    [perimeterInMeters]
  )

  const perimeterTooltipContent = useMemo(() => [lengthUnits.foot].map(perimeterInUnit).join('<br>'), [perimeterInUnit])

  return (
    <div className="geo-polygon-info">
      <FormItem label={i18n.t('geo.vertices')}>{GeoJsonUtils.countVertices(geoJson)}</FormItem>
      <FormItem label={i18n.t('geo.area')}>
        <div className="row">
          {areaInUnit(areaUnits.hectare)}
          <ButtonIconInfo isTitleMarkdown title={areaTooltipContent} />
        </div>
      </FormItem>
      <FormItem label={i18n.t('geo.perimeter')}>
        <div className="row">
          {perimeterInUnit(lengthUnits.meter)}
          <ButtonIconInfo title={perimeterTooltipContent} />
        </div>
      </FormItem>
    </div>
  )
}

GeoPolygonInfo.propTypes = {
  geoJson: PropTypes.object.isRequired,
}
