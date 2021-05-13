import React from 'react'

import { useI18n } from '@webapp/store/system'

const RowHeader = () => {
  const i18n = useI18n()

  return (
    <>
      <div />
      <div>{i18n.t('common.name')}</div>
      <div>{i18n.t('common.label')}</div>
      <div>{i18n.t('nodeDefEdit.basicProps.entitySource')}</div>
      <div />
    </>
  )
}

export default RowHeader
