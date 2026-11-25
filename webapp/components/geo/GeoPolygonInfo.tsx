import './GeoPolygonInfo.scss'

import { useCallback, useMemo } from 'react'
import type { Feature } from 'geojson'

import { Numbers } from '@openforis/arena-core'

import { GeoJsonUtils } from '@core/geo/geoJsonUtils'
import { NumberConversionUtils } from '@core/numberConversionUtils'
import { ButtonIconInfo } from '../buttons'
import { FormItem } from '../form/Input'

const { areaUnits, lengthUnits, abbreviationByUnit, metersToUnit, squareMetersToUnit } = NumberConversionUtils

const formatNumber = (value) => Numbers.formatDecimal(value, 2)

type GeoPolygonInfoProps = {
  geoJson: Feature
}

export const GeoPolygonInfo = (props: GeoPolygonInfoProps) => {
  const { geoJson } = props

  const areaInSquareMeters = useMemo(() => GeoJsonUtils.area(geoJson), [geoJson])

  const areaInUnit = useCallback(
    (unit) => `${formatNumber(squareMetersToUnit(unit)(areaInSquareMeters))} ${abbreviationByUnit[unit]}`,
    [areaInSquareMeters]
  )

  const areaTooltipContent = useMemo(
    () => [areaUnits.squareMeter, areaUnits.squareFoot, areaUnits.acre].map((unit) => areaInUnit(unit)).join('<br>'),
    [areaInUnit]
  )

  const perimeterInMeters = useMemo(() => GeoJsonUtils.perimeterInKm(geoJson) * 1000, [geoJson])

  const perimeterInUnit = useCallback(
    (unit) => `${formatNumber(metersToUnit(unit)(perimeterInMeters))} ${abbreviationByUnit[unit]}`,
    [perimeterInMeters]
  )

  const perimeterTooltipContent = useMemo(
    () => [lengthUnits.foot].map((unit) => perimeterInUnit(unit)).join('<br>'),
    [perimeterInUnit]
  )

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
