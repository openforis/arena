import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as NodeDef from '@core/survey/nodeDef'

const RecordsRowHeader = ({ nodeDefKeys, lang }) => {
  const i18n = useI18n()

  return (
    <>
      <div>#</div>
      {
        nodeDefKeys.map((k, i) => <div key={i}>{NodeDef.getLabel(k, lang)}</div>) //TODO use SurveyState.getNodeDefLabel
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
