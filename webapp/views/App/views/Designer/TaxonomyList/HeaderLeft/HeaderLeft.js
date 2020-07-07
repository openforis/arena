import React from 'react'

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
    </div>
  )
}

export default HeaderLeft
