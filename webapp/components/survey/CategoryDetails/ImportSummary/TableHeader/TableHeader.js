import React from 'react'

import { useI18n } from '@webapp/store/system'

const TableHeader = () => {
  const i18n = useI18n()

  return (
    <div className="table__row-header">
      <div>#</div>
      <div>{i18n.t('categoryEdit.importSummary.columns')}</div>
      <div>{i18n.t('common.type')}</div>
      <div>{i18n.t('categoryEdit.importSummary.dataType')}</div>
    </div>
  )
}

export default TableHeader
