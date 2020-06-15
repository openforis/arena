import React from 'react'

import { useI18n } from '@webapp/store/system'

const RowHeader = () => {
  const i18n = useI18n()
  return (
    <>
      <div />
      <div>{i18n.t('common.name')}</div>
      <div>{i18n.t('common.email')}</div>
      <div>{i18n.t('common.group')}</div>
      <div>{i18n.t('usersView.accepted')}</div>
    </>
  )
}

export default RowHeader
