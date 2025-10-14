import React from 'react'

import { useI18n } from '@webapp/store/system'

const RowHeader = () => {
  const i18n = useI18n()

  return (
    <>
      <div>#</div>
      <div>{i18n.t('common.path')}</div>
      <div>{i18n.t('common.type')}</div>
      <div>{i18n.t('homeView:collectImportReport.expression')}</div>
      <div>{i18n.t('nodeDefEdit.expressionsProp.applyIf')}</div>
      <div>{i18n.t('common.message_plural')}</div>
      <div>{i18n.t('homeView:collectImportReport.resolved')}</div>
      <div />
    </>
  )
}

export default RowHeader
