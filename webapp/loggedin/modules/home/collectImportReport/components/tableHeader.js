import React from 'react'

import { useI18n } from '../../../../../commonComponents/hooks'

const TableHeader = () => {
  const i18n = useI18n()

  return (
    <div className="table__row-header collect-import-report-header">
      <div>#</div>
      <div>{i18n.t('homeView.collectImportReport.path')}</div>
      <div>{i18n.t('common.type')}</div>
      <div>{i18n.t('homeView.collectImportReport.expression')}</div>
      <div>{i18n.t('nodeDefEdit.expressionsProp.applyIf')}</div>
      <div>{i18n.t('homeView.collectImportReport.messages')}</div>
      <div>{i18n.t('homeView.collectImportReport.resolved')}</div>
      <div/>
    </div>
  )
}

export default TableHeader