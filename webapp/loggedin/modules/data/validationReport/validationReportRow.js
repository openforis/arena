import React from 'react'

import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Authorizer from '@core/auth/authorizer'

import ValidationFieldMessages from '@webapp/commonComponents/validationFieldMessages'

const ValidationReportRow = ({ user, survey, row, idx, offset }) => {
  const i18n = useI18n()

  const nodeDefUuid = row.nodeDefUuid

  let keysHierarchy = row.keysHierarchy
  if (NodeDef.getUuid(Survey.getNodeDefRoot(survey)) === nodeDefUuid) {
    keysHierarchy = keysHierarchy.slice(1)
  }
  keysHierarchy = keysHierarchy.concat({ keys: row.keysSelf || {}, nodeDefUuid: row.nodeDefUuid })

  const path = R.pipe(
    R.map(hierarchyPart => {
      const keyValues = R.reject(R.isNil)(R.values((hierarchyPart.keys)))
      const keyValuesStr = keyValues.length ? `[${keyValues.join(', ')}]` : ''
      const parentNodeDef = Survey.getNodeDefByUuid(hierarchyPart.nodeDefUuid)(survey)
      const parentNodeDefLabel = NodeDef.getLabel(parentNodeDef, i18n.lang)

      return `${parentNodeDefLabel} ${keyValuesStr}`
    }),
    R.join(' / ')
  )(keysHierarchy)

  const surveyInfo = Survey.getSurveyInfo(survey)
  const canEdit = Survey.isPublished(surveyInfo) &&
    Authorizer.canEditRecord(user, {
      [Record.keys.step]: Record.getStep(row),
      [Record.keys.surveyUuid]: Survey.getUuid(surveyInfo),
      [Record.keys.ownerUuid]: Record.getOwnerUuid(row)
    })

  return (
    <>
      <div>
        {idx + offset + 1}
      </div>
      <div>
        {path}
      </div>
      <div className='validation_report__message'>
        <ValidationFieldMessages validation={row.validation} showKeys={false} showIcons={true} />
      </div>
      <div>
        <span className={`icon icon-12px icon-action ${canEdit ? 'icon-pencil2' : 'icon-eye'}`} />
      </div>
    </>
  )
}

export default ValidationReportRow
