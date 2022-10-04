import './CoordinateAttributePopUp.scss'

import React, { useEffect, useState } from 'react'
import { Popup } from 'react-leaflet'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import { ButtonIconEdit } from '@webapp/components'
import Markdown from '@webapp/components/markdown'
import axios from 'axios'

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
  const { attributeDef, recordUuid, parentUuid, ancestorsKeys, point, onRecordEditClick } = props

  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const [elevation, setElevation] = useState(null)

  useEffect(() => {
    const getElevation = async (lat, lng) => {
      const url = `/api/geo/map/elevation/${lat}/${lng}`
      let res, data
      try {
        res = await axios.get(url)
        data = res.data
      } catch {
        return null
      }
      setElevation(data.elevation)
    }
    getElevation(point.y, point.x)

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
  const { attributeDef, recordUuid, parentUuid, ancestorsKeys, point, onRecordEditClick } = props

  return (
    <Popup>
      <PopupContent
        attributeDef={attributeDef}
        recordUuid={recordUuid}
        parentUuid={parentUuid}
        ancestorsKeys={ancestorsKeys}
        point={point}
        onRecordEditClick={onRecordEditClick}
      />
    </Popup>
  )
}
