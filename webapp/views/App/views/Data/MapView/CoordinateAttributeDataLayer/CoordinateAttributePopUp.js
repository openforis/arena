import './CoordinateAttributePopUp.scss'

import React, { useEffect, useState } from 'react'
import { Popup, useMap } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyPreferredLang, useSurveyInfo } from '@webapp/store/survey'
import * as API from '@webapp/service/api'
import * as SamplingPolygon from '@core/survey/SamplingPolygon'



import { ButtonIconEdit } from '@webapp/components'
import Markdown from '@webapp/components/markdown'
import L from 'leaflet'

/**
 * builds the path to an attribute like ANCESTOR_ENTITY_LABEL_0 [ANCESTOR_ENTITY_0_KEYS] -> ANCESTOR_ENTITY_LABEL_1 [ANCESTOR_ENTITY_1_KEYS] ...
 * e.g. Cluster [123] -> Plot [4]
 */
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
        pathPart += `[${ancestorKeys.join(',')}]`
      }
    }
    pathParts.unshift(pathPart)
  })(survey)

  return pathParts.join(' -> ')
}

const PopupContent = (props) => {
  const { attributeDef, recordUuid, parentUuid, ancestorsKeys, point, pointLatLong, onRecordEditClick } = props

  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const [elevation, setElevation] = useState('...')

  useEffect(() => {
    const getElevation = async (lat, lng) => {
      const elev = await API.fetchElevation({ lat, lng })
      setElevation(elev === null ? 'error' : elev)
    }
    getElevation(pointLatLong.y, pointLatLong.x)
  }, [])

  const path = buildPath({ survey, attributeDef, ancestorsKeys, lang })

  const content = `**${path}**
* **x**: ${point.x}
* **y**: ${point.y}
* **SRS**: ${point.srs}
* **elevation (m)**: ${elevation}`

  return (
    <div className="coordinate-attribute-popup-content">
      <Markdown source={content} />
      <ButtonIconEdit label="mapView.editRecord" onClick={() => onRecordEditClick({ recordUuid, parentUuid })} />
    </div>
  )
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

  const i18n = useI18n()
  const map = useMap()
  const surveyInfo = useSurveyInfo()

  const flyTo = (point) => {
    const [longitude, latitude] = point.geometry.coordinates
    map.flyTo([latitude, longitude], map.getMaxZoom())
    map.once('zoomend', () => openPopupOfPoint(point))
  }

  const onClickNext = () => {
    const nextPoint = getNextPoint(parentUuid)
    flyTo(nextPoint)
  }
  
  const onClickPrevious = () => {
    const previousPoint = getPreviousPoint(parentUuid)
    flyTo(previousPoint)
  }
  
  const earthMapLink = () => {
    const bounds = SamplingPolygon.getBounds(surveyInfo, point.y, point.x)
    const geojson = L.rectangle(bounds).toGeoJSON()
    const url = "https://earthmap.org/?polygon=" + JSON.stringify(geojson)
    return url
    
  }

  return (
    <Popup>
      <PopupContent
        attributeDef={attributeDef}
        recordUuid={recordUuid}
        parentUuid={parentUuid}
        ancestorsKeys={ancestorsKeys}
        point={point}
        pointLatLong={pointLatLong}
        onRecordEditClick={onRecordEditClick}
      />
      <button onClick={onClickPrevious}>{i18n.t('common.previous')}</button>
      <button onClick={onClickNext}>{i18n.t('common.next')} </button>
      <a href={earthMapLink()} target="earthmap" rel="origin">
        <button>Open in Earth Map</button>
      </a>
    </Popup>
  )
}

PopupContent.propTypes = {
  attributeDef: PropTypes.any,
  recordUuid: PropTypes.string,
  parentUuid: PropTypes.string,
  ancestorsKeys: PropTypes.any,
  point: PropTypes.object,
  pointLatLong: PropTypes.object,
  onRecordEditClick: PropTypes.func,
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
