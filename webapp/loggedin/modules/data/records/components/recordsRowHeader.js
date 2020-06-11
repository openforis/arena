import React from 'react'

import { useI18n, useLang } from '@webapp/store/system'

import * as NodeDef from '@core/survey/nodeDef'

const RecordsRowHeader = () => {
  const nodeDefKeys = [] // TODO: fetch them
  const i18n = useI18n()
  const lang = useLang()
  return (
    <>
      <div>#</div>
      {
        nodeDefKeys.map((k) => (
          <div key={NodeDef.getUuid(k)}>{NodeDef.getLabel(k, lang)}</div>
        )) // TODO use SurveyState.getNodeDefLabel
      }
      <div>{i18n.t('common.dateCreated')}</div>
      <div>{i18n.t('common.dateLastModified')}</div>
      <div>{i18n.t('dataView.records.owner')}</div>
      <div>{i18n.t('dataView.records.step')}</div>
      <div>{i18n.t('common.error_plural')}</div>
      <div>{i18n.t('common.warning_plural')}</div>
    </>
  )
}

export default RecordsRowHeader
