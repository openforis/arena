import React from 'react'

import { useI18n, useLang } from '@webapp/store/system'

import * as NodeDef from '@core/survey/nodeDef'
import { useNodeDefRootKeys } from '@webapp/store/survey'

const RowHeader = () => {
  const nodeDefs = useNodeDefRootKeys()
  const i18n = useI18n()
  const lang = useLang()
  return (
    <>
      <div>#</div>
      {Object.values(nodeDefs).map((nodeDef) => (
        <div key={NodeDef.getUuid(nodeDef)}>{NodeDef.getLabel(nodeDef, lang)}</div>
      ))}
      <div>{i18n.t('common.dateCreated')}</div>
      <div>{i18n.t('common.dateLastModified')}</div>
      <div>{i18n.t('dataView.records.owner')}</div>
      <div>{i18n.t('dataView.records.step')}</div>
      <div>{i18n.t('common.error_plural')}</div>
      <div>{i18n.t('common.warning_plural')}</div>
    </>
  )
}

export default RowHeader
