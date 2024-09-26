import './CoordinateAttributePopUp.scss'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Popup } from 'react-leaflet'
import PropTypes from 'prop-types'
import circleToPolygon from 'circle-to-polygon'
import L from 'leaflet'

import { Objects, PointFactory, DEFAULT_SRS } from '@openforis/arena-core'

import * as NumberUtils from '@core/numberUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SamplingPolygon from '@core/survey/SamplingPolygon'

import { Button, ButtonIconEdit } from '@webapp/components'
import Markdown from '@webapp/components/markdown'
import { ButtonPrevious } from '@webapp/components/buttons/ButtonPrevious'
import { ButtonNext } from '@webapp/components/buttons/ButtonNext'

import { useSurvey, useSurveyPreferredLang, useSurveyInfo } from '@webapp/store/survey'
import { useUserName } from '@webapp/store/user/hooks'
import { useI18n } from '@webapp/store/system'

import { useAltitude } from '../common/useAltitude'
import { WhispMenuButton } from './WhispMenuButton'

const getEarthMapUrl = (geojson) => `https://earthmap.org/?aoi=global&polygon=${JSON.stringify(geojson)}`

// Builds the path to an attribute like ANCESTOR_ENTITY_LABEL_0 [ANCESTOR_ENTITY_0_KEYS] -> ANCESTOR_ENTITY_LABEL_1 [ANCESTOR_ENTITY_1_KEYS] ...
// E.g. Cluster [123] -> Plot [4].
const buildPath = ({ survey, attributeDef, ancestorsKeys, lang }) => {
  const pathParts = []

  const keyDefs = Survey.getNodeDefAncestorsKeyAttributes(attributeDef)(survey)

  Survey.visitAncestorsAndSelf(attributeDef, (nodeDef) => {
    const label = NodeDef.getLabel(nodeDef, lang)
    let pathPart = `${label}`
    if (!NodeDef.isEqual(attributeDef)(nodeDef)) {
      const ancestorKeys = ancestorsKeys.filter((_ancestorKey, index) => {
        const ancestorKeyDef = keyDefs[index]
        return NodeDef.getParentUuid(ancestorKeyDef) === NodeDef.getUuid(nodeDef)
      })
      if (ancestorKeys.length > 0) {
        pathPart += `[${ancestorKeys.join(', ')}]`
      }
    }
    pathParts.unshift(pathPart)
  })(survey)

  return pathParts.join(' -> ')
}

const generateContent = ({ i18n, recordOwnerName, point, path, altitude }) => {
  const coordinateNumericFieldPrecision = point.srs === DEFAULT_SRS.code ? 6 : NaN
  const xFormatted = NumberUtils.roundToPrecision(point.x, coordinateNumericFieldPrecision)
  const yFormatted = NumberUtils.roundToPrecision(point.y, coordinateNumericFieldPrecision)

  const content = `**${path}**
* **X**: ${xFormatted}
* **Y**: ${yFormatted}
* **SRS**: ${point.srs}
* **${i18n.t('mapView.altitude')}**: ${altitude}
* **${i18n.t('common.owner')}**: ${recordOwnerName ?? '...'}`
  return content
}

export const CoordinateAttributePopUp = (props) => {
  const { attributeDef, flyToNextPoint, flyToPreviousPoint, onRecordEditClick, pointFeature } = props

  const { recordUuid, recordOwnerUuid, parentUuid, point, ancestorsKeys } = pointFeature.properties
  const [longitude, latitude] = pointFeature.geometry.coordinates

  const popupRef = useRef(null)
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()

  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const [open, setOpen] = useState(false)

  const pointLatLong = PointFactory.createInstance({ x: longitude, y: latitude })
  // fetch altitude and record owner name only when popup is open
  const altitude = useAltitude({ survey, point: pointLatLong, active: open })
  const recordOwnerName = useUserName({ userUuid: recordOwnerUuid, active: open })

  const onRemove = useCallback(() => {
    setOpen(false)
    onRecordEditClick(null)
  }, [onRecordEditClick])

  const onClickNext = useCallback(() => {
    flyToNextPoint(pointFeature)
    popupRef.current?.close()
  }, [flyToNextPoint, pointFeature])

  const onClickPrevious = useCallback(() => {
    flyToPreviousPoint(pointFeature)
    popupRef.current?.close()
  }, [flyToPreviousPoint, pointFeature])

  const path = useMemo(
    () => buildPath({ survey, attributeDef, ancestorsKeys, lang }),
    [ancestorsKeys, attributeDef, lang, survey]
  )

  const generateGeoJson = useCallback(() => {
    if (Survey.isSampleBasedImageInterpretationEnabled(surveyInfo)) {
      const isCircle = SamplingPolygon.getIsCircle(surveyInfo)
      if (isCircle) {
        const radius = SamplingPolygon.getRadius(surveyInfo)
        return circleToPolygon([longitude, latitude], radius)
      } else {
        const bounds = SamplingPolygon.getBounds(surveyInfo, latitude, longitude)
        return L.rectangle(bounds).toGeoJSON()
      }
    } else {
      // default 100mx100m square
      const bounds = SamplingPolygon.generateBounds({ latitude, longitude })
      return L.rectangle(bounds).toGeoJSON()
    }
  }, [latitude, longitude, surveyInfo])

  const generateGeoJsonWithName = useCallback(() => {
    const geojson = generateGeoJson()
    return Objects.setInPath({ obj: geojson, path: ['properties', 'name'], value: path })
  }, [generateGeoJson, path])

  const onEarthMapButtonClick = useCallback(() => {
    const geojson = generateGeoJsonWithName()
    const url = getEarthMapUrl(geojson)
    window.open(url, 'EarthMap')
  }, [generateGeoJsonWithName])

  const content = useMemo(
    () => generateContent({ i18n, recordOwnerName, point, path, altitude }),
    [altitude, i18n, path, point, recordOwnerName]
  )

  return (
    <Popup
      eventHandlers={{
        add: () => setOpen(true),
        remove: onRemove,
      }}
      ref={popupRef}
    >
      <div className="coordinate-attribute-popup-content">
        <Markdown source={content} />

        <div className="button-bar">
          <div className="row">
            <ButtonPrevious className="prev-btn" onClick={onClickPrevious} showLabel={false} />

            <ButtonIconEdit
              label="mapView.editRecord"
              showLabel
              onClick={() => onRecordEditClick({ recordUuid, parentUuid })}
              variant="contained"
            />

            <ButtonNext className="next-btn" onClick={onClickNext} showLabel={false} />
          </div>
          <div className="row">
            <Button
              className="earth-map-btn"
              iconAlt="Earth Map"
              iconSrc="/img/of_earth_map_icon_small.png"
              label="mapView.earthMap"
              size="small"
              onClick={onEarthMapButtonClick}
              variant="outlined"
            />
            <WhispMenuButton geoJsonGenerator={generateGeoJsonWithName} />
          </div>
        </div>
      </div>
    </Popup>
  )
}

CoordinateAttributePopUp.propTypes = {
  attributeDef: PropTypes.any.isRequired,
  pointFeature: PropTypes.any.isRequired,
  onRecordEditClick: PropTypes.func.isRequired,
  flyToNextPoint: PropTypes.func.isRequired,
  flyToPreviousPoint: PropTypes.func.isRequired,
}
