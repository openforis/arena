import React from 'react'

import { useI18n } from '@webapp/store/system'
import { useAuthCanViewOtherUsersEmail } from '@webapp/store/user'

const RowHeader = () => {
  const i18n = useI18n()
  const emailVisible = useAuthCanViewOtherUsersEmail()

  return (
    <>
      <div />
      <div>{i18n.t('common.name')}</div>
      {emailVisible && <div>{i18n.t('common.email')}</div>}
      <div>{i18n.t('common.group')}</div>
      <div>{i18n.t('usersView.invitedBy')}</div>
      <div>{i18n.t('usersView.invitedDate')}</div>
      <div>{i18n.t('usersView.accepted')}</div>
      <div>{i18n.t('usersView.lastLogin')}</div>
    </>
  )
}

export default RowHeader
