import React from 'react'
<<<<<<< HEAD
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/store/system'

const HeaderLeft = () => {
  const i18n = useI18n()

  return (
    <div>
      <Link to={appModuleUri(designerModules.taxonomy)} className="btn btn-s">
        <span className="icon icon-user-plus icon-12px icon-left" />
        {i18n.t('usersView.inviteUser')}
      </Link>
=======
// import { Link } from 'react-router-dom'

// import { useI18n } from '@webapp/store/system'
// import { useAuthCanInviteUser } from '@webapp/store/user'

// import { appModuleUri, userModules } from '@webapp/app/appModules'

const HeaderLeft = () => {
  // const i18n = useI18n()
  //const canInvite = useAuthCanInviteUser()

  return (
    <div>
      {/*{canInvite && (
        <Link to={appModuleUri(userModules.userInvite)} className="btn btn-s">
          <span className="icon icon-user-plus icon-12px icon-left" />
          {i18n.t('usersView.inviteUser')}
        </Link>
      )}*/}
      <span>Add</span>
>>>>>>> origin/refactor/taxonomies-list
    </div>
  )
}

export default HeaderLeft
