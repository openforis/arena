import './GeoPolygonInfo.scss'

import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Numbers } from '@openforis/arena-core'

import { NumberConversionUtils } from '@core/numberConversionUtils'

import { GeoJsonUtils } from '@webapp/utils/geoJsonUtils'

import { FormItem } from '../form/Input'
import { ButtonIconInfo } from '../buttons'

const { areaUnits, lengthUnits, abbreviationByUnit, metersToUnit, squareMetersToUnit } = NumberConversionUtils

const formatNumber = (value) => Numbers.formatDecimal(value, 2)

export const GeoPolygonInfo = (props) => {
  const { geoJson } = props

  const areaInSquareMeters = useMemo(() => GeoJsonUtils.area(geoJson), [geoJson])

  const areaInUnit = useCallback(
    (unit) => `${formatNumber(squareMetersToUnit(unit)(areaInSquareMeters))} ${abbreviationByUnit[unit]}`,
    [areaInSquareMeters]
  )

  const areaTooltipContent = useMemo(
    () => [areaUnits.squareMeter, areaUnits.squareFoot, areaUnits.acre].map(areaInUnit).join('<br>'),
    [areaInUnit]
  )

  const perimeterInMeters = useMemo(() => GeoJsonUtils.perimeter(geoJson), [geoJson])

  const perimeterInUnit = useCallback(
    (unit) => `${formatNumber(metersToUnit(unit)(perimeterInMeters))} ${abbreviationByUnit[unit]}`,
    [perimeterInMeters]
  )

  const perimeterTooltipContent = useMemo(() => [lengthUnits.foot].map(perimeterInUnit).join('<br>'), [perimeterInUnit])

  const verticesCount = useMemo(() => GeoJsonUtils.countVertices(geoJson), [geoJson])
  const area = useMemo(() => areaInUnit(areaUnits.hectare), [areaInUnit])
  const perimeter = useMemo(() => perimeterInUnit(lengthUnits.meter), [perimeterInUnit])

  return (
    <div className="geo-polygon-info">
      {verticesCount ? <FormItem label="geo.vertices">{verticesCount}</FormItem> : null}
      <FormItem label="geo.area">
        <div className="row">
          {area}
          <ButtonIconInfo isTitleMarkdown title={areaTooltipContent} />
        </div>
      </FormItem>
      <FormItem label="geo.perimeter">
        <div className="row">
          {perimeter}
          <ButtonIconInfo title={perimeterTooltipContent} />
        </div>
      </FormItem>
    </div>
  )
}

GeoPolygonInfo.propTypes = {
  geoJson: PropTypes.object.isRequired,
}
