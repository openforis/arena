import React from 'react'
import { Link } from 'react-router-dom'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { useAuthCanInviteUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

const HeaderLeft = () => {
  const i18n = useI18n()
  const canInvite = useAuthCanInviteUser()

  return (
    <div>
      {canInvite && (
        <Link data-testid={TestId.userList.inviteBtn} to={appModuleUri(userModules.userInvite)} className="btn btn-s">
          <span className="icon icon-user-plus icon-12px icon-left" />
          {i18n.t('usersView.inviteUser')}
        </Link>
      )}
    </div>
  )
}

export default HeaderLeft
