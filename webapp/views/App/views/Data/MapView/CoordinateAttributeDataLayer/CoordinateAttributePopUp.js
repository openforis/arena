import './CoordinateAttributePopUp.scss'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Popup, useMap } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyPreferredLang, useSurveyInfo } from '@webapp/store/survey'
import * as SamplingPolygon from '@core/survey/SamplingPolygon'
import L from 'leaflet'

import { ButtonIconEdit, ButtonIconGear } from '@webapp/components'
import Markdown from '@webapp/components/markdown'
import { ButtonPrevious } from '@webapp/components/buttons/ButtonPrevious'
import { ButtonNext } from '@webapp/components/buttons/ButtonNext'

import { useElevation } from '../common/useElevation'
import { useI18n } from '@webapp/store/system'
const circleToPolygon = require('circle-to-polygon')

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
        pathPart += ` [${ancestorKeys.join(', ')}]`
      }
    }
    pathParts.unshift(pathPart)
  })(survey)

  return pathParts.join(' -> ')
}

export const CoordinateAttributePopUp = (props) => {
  const {
    attributeDef,
    recordUuid,
    parentUuid,
    ancestorsKeys,
    point,
    pointLatLong,
    onRecordEditClick,
    getNextPoint,
    getPreviousPoint,
    openPopupOfPoint,
  } = props

  const popupRef = useRef(null)
  const i18n = useI18n()
  const map = useMap()
  const surveyInfo = useSurveyInfo()

  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const [open, setOpen] = useState(false)

  const elevation = useElevation({ surveyId: Survey.getIdSurveyInfo(surveyInfo), point: pointLatLong, active: open })

  const flyTo = useCallback(
    (point) => {
      popupRef.current?.close()
      const [longitude, latitude] = point.geometry.coordinates
      map.flyTo([latitude, longitude], map.getMaxZoom())
      map.once('zoomend', () => openPopupOfPoint(point))
    },
    [map, openPopupOfPoint]
  )

  const onClickNext = useCallback(() => {
    const nextPoint = getNextPoint(parentUuid)
    flyTo(nextPoint)
  }, [flyTo, getNextPoint, parentUuid])

  const onClickPrevious = useCallback(() => {
    const previousPoint = getPreviousPoint(parentUuid)
    flyTo(previousPoint)
  }, [flyTo, getPreviousPoint, parentUuid])

  const onEarthMapButtonClick = useCallback(() => {
    let geojson
    const isCircle = SamplingPolygon.getIsCircle(surveyInfo)
    if (isCircle) {
      const radius = SamplingPolygon.getRadius(surveyInfo)
      geojson = circleToPolygon([pointLatLong.x, pointLatLong.y], radius)
    } else {
      const bounds = SamplingPolygon.getBounds(surveyInfo, pointLatLong.y, pointLatLong.x)
      geojson = L.rectangle(bounds).toGeoJSON()
    }
    const earthMapUrl = 'https://earthmap.org/?polygon=' + JSON.stringify(geojson)
    window.open(earthMapUrl, 'EarthMap')
  }, [pointLatLong.x, pointLatLong.y, surveyInfo])

  const path = useMemo(
    () => buildPath({ survey, attributeDef, ancestorsKeys, lang }),
    [ancestorsKeys, attributeDef, lang, survey]
  )

  const content = `**${path}**
* **X**: ${point.x}
* **Y**: ${point.y}
* **SRS**: ${point.srs}
* **${i18n.t('mapView.elevation')}**: ${elevation}`

  return (
    <Popup
      eventHandlers={{
        add: () => setOpen(true),
        remove: () => setOpen(false),
      }}
      ref={popupRef}
    >
      <div className="coordinate-attribute-popup-content">
        <Markdown source={content} />

        <div className="button-bar">
          <div role="row">
            <ButtonPrevious className="prev-btn" onClick={onClickPrevious} showLabel={false} />

            <ButtonIconEdit
              label="mapView.editRecord"
              showLabel
              onClick={() => onRecordEditClick({ recordUuid, parentUuid })}
            />

            <ButtonNext className="next-btn" onClick={onClickNext} showLabel={false} />
          </div>
          <div role="row">
            <ButtonIconGear label="mapView.openInEarthMap" showLabel size="small" onClick={onEarthMapButtonClick} />
          </div>
        </div>
      </div>
    </Popup>
  )
}

CoordinateAttributePopUp.propTypes = {
  attributeDef: PropTypes.any,
  recordUuid: PropTypes.string,
  parentUuid: PropTypes.string,
  ancestorsKeys: PropTypes.any,
  point: PropTypes.any,
  pointLatLong: PropTypes.object,
  onRecordEditClick: PropTypes.func,
  getNextPoint: PropTypes.func,
  getPreviousPoint: PropTypes.func,
  openPopupOfPoint: PropTypes.func,
}
