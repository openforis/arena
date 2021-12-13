import './CoordinateAttributePopUp.scss'

import React, { useEffect, useState } from 'react'
import { Popup } from 'react-leaflet'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

import { ButtonIconEdit } from '@webapp/components'
import Markdown from '@webapp/components/markdown'

const PopupContent = (props) => {
  const { attributeDef, recordUuid, parentUuid, point, onRecordEditClick } = props

  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const cycle = useSurveyCycleKey()

  const [record, setRecord] = useState(null)

  useEffect(() => {
    if (!record) {
      const loadRecord = async () => {
        const recordLoaded = await API.fetchRecordSummary({ surveyId: Survey.getId(survey), cycle, recordUuid })
        setRecord(recordLoaded)
      }
      loadRecord()
    }
  }, [record, setRecord])

  const keyDefs = Survey.getNodeDefRootKeys(survey)

  const pathParts = []
  Survey.visitAncestorsAndSelf(attributeDef, (nodeDef) => {
    pathParts.unshift(NodeDef.getLabel(nodeDef, lang))
  })(survey)

  // add record keys to first part of the path
  if (record) {
    pathParts[0] = `${pathParts[0]} [${keyDefs.map((keyDef) => record[NodeDef.getName(keyDef)]).join(',')}]`
  }

  const path = pathParts.join(' -> ')
  const content = `**${path}**
* **x**: ${point.x}
* **y**: ${point.y}
* **SRS**: ${point.srs}`

  return (
    <div className="coordinate-attribute-popup-content">
      <Markdown source={content} />
      <ButtonIconEdit label="mapView.editRecord" onClick={() => onRecordEditClick({ recordUuid, parentUuid })} />
    </div>
  )
}

export const CoordinateAttributePopUp = (props) => {
  const { attributeDef, recordUuid, parentUuid, point, onRecordEditClick } = props

  return (
    <Popup>
      <PopupContent
        attributeDef={attributeDef}
        recordUuid={recordUuid}
        parentUuid={parentUuid}
        point={point}
        onRecordEditClick={onRecordEditClick}
      />
    </Popup>
  )
}
