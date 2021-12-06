import React, { useEffect, useState } from 'react'
import { Popup } from 'react-leaflet'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

import { ButtonIconEdit } from '@webapp/components'
import Markdown from '@webapp/components/markdown'

export const CoordinateAttributePopUp = (props) => {
  const { attributeDef, recordUuid, parentUuid, point, onRecordEditClick } = props
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const [record, setRecord] = useState(null)

  const keyDefs = Survey.getNodeDefRootKeys(survey)

  useEffect(() => {
    const loadRecordSummary = async () => {
      setRecord(await API.fetchRecordSummary({ surveyId: Survey.getId(survey), cycle, recordUuid }))
    }
    loadRecordSummary()
  }, [])

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
    <Popup>
      <Markdown source={content} />
      <ButtonIconEdit label="Edit Record" onClick={() => onRecordEditClick({ recordUuid, parentUuid })} />
    </Popup>
  )
}
