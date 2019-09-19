import React from 'react'
import camelize from 'camelize'

import { Link } from 'react-router-dom'

import useI18n from '../../../../../commonComponents/useI18n'
import ErrorBadge from '../../../../../commonComponents/errorBadge'

import Survey from '../../../../../../common/survey/survey'
import NodeDef from '../../../../../../common/survey/nodeDef'
import Record from '../../../../../../common/record/record'
import Validation from '../../../../../../common/validation/validation'
import Authorizer from '../../../../../../common/auth/authorizer'
import Date from '../../../../../../common/dateUtils'

import { appModuleUri, dataModules } from '../../../../appModules'

const RecordsRow = props => {
  const {
    row: record, nodeDefKeys,
    surveyInfo, user,
    idx, offset,
  } = props

  const i18n = useI18n()

  const canEdit = Survey.isPublished(surveyInfo) && Authorizer.canEditRecord(user, record)

  return (
    <>
      <div>
        <ErrorBadge
          validation={Validation.getValidation(record)}
          showLabel={false}
          className="error-badge-inverse"
        />
        {idx + offset + 1}
      </div>
      {
        nodeDefKeys.map((n, i) =>
          <div key={i}>{record[camelize(NodeDef.getName(n))]}</div>
        )
      }
      <div>
        {Date.getRelativeDate(i18n, Record.getDateCreated(record))}
      </div>
      <div>
        {Date.getRelativeDate(i18n, Record.getDateModified(record))}
      </div>
      <div>
        {Record.getOwnerName(record)}
      </div>
      <div>
        {Record.getStep(record)}
      </div>
      <div>
        <Link to={appModuleUri(dataModules.record) + Record.getUuid(record)} className="btn-edit">
          <span className={`icon icon-12px ${canEdit ? 'icon-pencil2' : 'icon-eye'}`}/>
        </Link>
      </div>
    </>
  )
}

export default RecordsRow
