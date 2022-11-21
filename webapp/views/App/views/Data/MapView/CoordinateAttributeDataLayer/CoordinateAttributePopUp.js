import './CoordinateAttributePopUp.scss'

import React, { useState } from 'react'
import { Popup, useMap } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import { ButtonIconEdit } from '@webapp/components'
import Markdown from '@webapp/components/markdown'
import { ButtonPrevious } from '@webapp/components/buttons/ButtonPrevious'
import { ButtonNext } from '@webapp/components/buttons/ButtonNext'

import { useElevation } from '../common/useElevation'

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

  const map = useMap()

  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const [open, setOpen] = useState(false)

  const elevation = useElevation(pointLatLong, open)

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

  const path = buildPath({ survey, attributeDef, ancestorsKeys, lang })

  const content = `**${path}**
* **x**: ${point.x}
* **y**: ${point.y}
* **SRS**: ${point.srs}
* **elevation (m)**: ${elevation}`

  return (
    <Popup
      eventHandlers={{
        add: () => setOpen(true),
        remove: () => setOpen(false),
      }}
    >
      <div className="coordinate-attribute-popup-content">
        <Markdown source={content} />

        <div className="button-bar">
          <ButtonPrevious className="prev-btn" onClick={onClickPrevious} showLabel={false} />

          <ButtonIconEdit
            label="mapView.editRecord"
            showLabel
            onClick={() => onRecordEditClick({ recordUuid, parentUuid })}
          />

          <ButtonNext className="next-btn" onClick={onClickNext} showLabel={false} />
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
