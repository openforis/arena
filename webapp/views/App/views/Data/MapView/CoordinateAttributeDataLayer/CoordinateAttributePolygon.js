import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Rectangle, Circle } from 'react-leaflet'
import GeometryUtil from 'leaflet-geometryutil'
import L from 'leaflet'

import * as SamplingPolygon from '@core/survey/SamplingPolygon'

import { useMapContextOptions } from '@webapp/components/Map/MapContext'
import { useSurveyInfo } from '@webapp/store/survey'

export const CoordinateAttributePolygon = (props) => {
  const surveyInfo = useSurveyInfo()

  const options = useMapContextOptions()
  const { showSamplingPolygon, showControlPoints, showPlotReferencePoint } = options
  const SamplingPolygonOpoacity = showSamplingPolygon ? 1 : 0

  const { latitude, longitude } = props

  const len_lat_meters = SamplingPolygon.getLengthLatitude(surveyInfo)
  const len_lng_meters = SamplingPolygon.getLengthLongitude(surveyInfo)
  const numberOfPointsNorth = SamplingPolygon.getNumberOfPointsNorth(surveyInfo)
  const numberOfPointsEast = SamplingPolygon.getNumberOfPointsEast(surveyInfo)
  const numberOfPointsCircle = SamplingPolygon.getNumberOfPointsCircle(surveyInfo)
  const controlPointOffsetNorth = SamplingPolygon.getControlPointOffsetNorth(surveyInfo)
  const controlPointOffsetEast = SamplingPolygon.getControlPointOffsetEast(surveyInfo)
  const isCircle = SamplingPolygon.getIsCircle(surveyInfo)
  const radius = SamplingPolygon.getRadius(surveyInfo)

  const len_lat = SamplingPolygon.MetersToDegreesLatitude(len_lat_meters) //how many degrees lat length is
  const len_lng = SamplingPolygon.MetersToDegreesLongitude(len_lng_meters, latitude) // how many degrees lng length is (at the middle point)
  const control_point_latlng = L.latLng(
    latitude + SamplingPolygon.MetersToDegreesLatitude(controlPointOffsetNorth),
    longitude + SamplingPolygon.MetersToDegreesLongitude(controlPointOffsetEast, latitude)
  )

  const bounds = SamplingPolygon.getBounds(surveyInfo, latitude, longitude)

  const pointSize = 10
  const pointSizeLat = SamplingPolygon.MetersToDegreesLatitude(pointSize)

  const pointDistanceLat = len_lat / numberOfPointsNorth
  const startLat = bounds.getSouthWest().lat + len_lat / numberOfPointsEast / 2 - pointSizeLat / 2

  const [colors, setColors] = useState([...Array(numberOfPointsEast)].map(() => Array(numberOfPointsNorth).fill(0))) // this generates zero matrix
  const [circleColors, setCircleColors] = useState(Array(numberOfPointsCircle).fill(0))
  let circleControlPointIndex = 0

  const onClickControlPoint = (j, i) => {
    const newArray = [...colors]
    newArray[j][i] = (newArray[j][i] + 1) % Object.keys(PointColor).length
    setColors(newArray)
  }

  const onClickCircleControlPoint = (i) => {
    const newArray = [...circleColors]
    newArray[i] = (newArray[i] + 1) % Object.keys(PointColor).length
    setCircleColors(newArray)
  }

  const circleControlPoints = () => {
    const middle = [latitude, longitude]
    switch (numberOfPointsCircle) {
      case 4:
        return nCircles(middle, radius / 2, 4, 45)
      case 5:
        return fiveCircles(middle, radius)
      case 10:
        return tenCircles(middle, radius)
      case 12:
        return twelveCirles(middle, radius)
      case 21:
        return twentyOneCircles(middle, radius)
    }
  }

  /************************************************************************************************
    Different number of control points are rendered differently, so each has own function for clarity 
    **************************************************************************************************/
  const twentyOneCircles = (middle, radius) => {
    const margin = radius / 4.5
    const innerCat = radius / 2 / Math.SQRT2
    return [
      centerCircle(middle),
      ...nCircles(middle, radius / 2, 4, 45),
      ...nCircles(middle, innerCat, 4, 0),
      ...nCircles(middle, radius - margin, 4, 25),
      ...nCircles(middle, radius - margin, 4, 65),
      ...nCircles(middle, 2 * innerCat, 4, 90),
    ]
  }

  const twelveCirles = (middle, radius) => {
    return [...nCircles(middle, radius / 2, 4, 45), nCircles(middle, radius, 8, 20)]
  }
  const tenCircles = (middle, radius) => {
    return [centerCircle(middle), ...nCircles(middle, radius / 2, 9, 45)]
  }

  const fiveCircles = (middle, radius) => {
    return [centerCircle(middle), ...nCircles(middle, radius / 2, 4, 45)]
  }
  const centerCircle = (middle) => {
    const latlng = L.latLng(middle)
    const pointIndex = circleControlPointIndex
    let item = (
      <Circle
        center={latlng}
        radius={5}
        key={'controlpoint_' + pointIndex}
        pathOptions={{ color: PointColor[circleColors[pointIndex]] }}
        eventHandlers={{
          click: () => {
            onClickCircleControlPoint(pointIndex)
          },
        }}
      />
    )
    circleControlPointIndex++
    return item
  }

  const nCircles = (middle, radius, amount, angle = 0) => {
    const middle_latlng = L.latLng(middle)
    let pointArray = []
    for (let i = 0; i < 360; i += 360 / amount) {
      const latlng = GeometryUtil.destination(middle_latlng, i + angle, radius)
      const pointIndex = circleControlPointIndex
      pointArray.push(
        <Circle
          center={latlng}
          radius={5}
          key={'controlpoint_' + pointIndex}
          pathOptions={{ color: PointColor[circleColors[pointIndex]] }}
          eventHandlers={{
            click: () => {
              onClickCircleControlPoint(pointIndex)
            },
          }}
        />
      )
      circleControlPointIndex++
    }
    return pointArray
  }

  /******** End circle controlpoint functions  *************/

  const rectangleControlPoints = () => {
    let points = []
    for (let eastIndex = 0; eastIndex < numberOfPointsEast; eastIndex++) {
      for (let northIndex = 0; northIndex < numberOfPointsNorth; northIndex++) {
        const pointDistanceLng =
          SamplingPolygon.MetersToDegreesLongitude(len_lng_meters, startLat + northIndex * pointDistanceLat) /
          numberOfPointsEast
        const pointSizeLng = SamplingPolygon.MetersToDegreesLongitude(
          pointSize,
          startLat + northIndex * pointDistanceLat
        )
        const startLon = bounds.getSouthWest().lng + len_lng / numberOfPointsNorth / 2 - pointSizeLat / 2
        points.push(
          <Rectangle
            bounds={[
              [startLat + northIndex * pointDistanceLat, startLon + eastIndex * pointDistanceLng],
              [
                startLat + northIndex * pointDistanceLat + pointSizeLat,
                startLon + eastIndex * pointDistanceLng + pointSizeLng,
              ],
            ]}
            pathOptions={{ color: PointColor[colors[eastIndex][northIndex]] }}
            interactive={true}
            eventHandlers={{
              click: () => {
                onClickControlPoint(eastIndex, northIndex)
              },
            }}
            key={'controlPoint' + northIndex + '' + eastIndex}
          />
        )
      }
    }
    return points
  }

  const referencePoint = () => {
    return (
      <Circle
        center={control_point_latlng}
        radius={5}
        pathOptions={{ color: 'red', fill: true }}
        key={'ReferencePoint'}
      />
    )
  }

  if (isCircle) {
    return (
      <Circle
        center={[latitude, longitude]}
        radius={radius}
        pathOptions={{ color: 'yellow', fill: false, dashArray: '10, 20', opacity: SamplingPolygonOpoacity }}
      >
        {showPlotReferencePoint && referencePoint()}
        {showControlPoints && circleControlPoints()}
      </Circle>
    )
  } else
    return (
      <Rectangle
        bounds={bounds}
        pathOptions={{ color: LineColor[0], fill: false, dashArray: '10 20', opacity: SamplingPolygonOpoacity }}
      >
        {showPlotReferencePoint && referencePoint()}
        {showControlPoints && rectangleControlPoints()}
      </Rectangle>
    )
}

const PointColor = {
  0: 'Green',
  1: 'DeepSkyBlue',
  2: 'Yellow',
  3: 'Red',
  4: 'Pink',
}

const LineColor = {
  0: 'Yellow',
  1: 'Red',
}

CoordinateAttributePolygon.propTypes = {
  latitude: PropTypes.any,
  longitude: PropTypes.any,
}
