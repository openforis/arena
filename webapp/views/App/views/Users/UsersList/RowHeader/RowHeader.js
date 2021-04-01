import React from 'react'

import { useI18n } from '@webapp/store/system'
import { useUserIsSystemAdmin } from '@webapp/store/user'

const RowHeader = () => {
  const i18n = useI18n()
  const isSystemAdmin = useUserIsSystemAdmin()
  return (
    <>
      <div />
      <div>{i18n.t('common.name')}</div>
      {isSystemAdmin && <div>{i18n.t('common.email')}</div>}
      <div>{i18n.t('common.group')}</div>
      <div>{i18n.t('usersView.invitedBy')}</div>
      <div>{i18n.t('usersView.invitedDate')}</div>
      <div>{i18n.t('usersView.accepted')}</div>
    </>
  )
}

export default RowHeader
