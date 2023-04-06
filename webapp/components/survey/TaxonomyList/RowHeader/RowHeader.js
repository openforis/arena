import React from 'react'

import { useI18n } from '@webapp/store/system'

const RowHeader = () => {
  const i18n = useI18n()
  return (
    <>
      <div>{i18n.t('common.name')}</div>
      <div>{i18n.t('common.description')}</div>
      <div>{i18n.t('extraProp.label_plural')}</div>
    </>
  )
}

export default RowHeader
