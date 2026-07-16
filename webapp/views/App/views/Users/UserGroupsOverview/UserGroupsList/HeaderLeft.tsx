import React from 'react'
import { useNavigate } from 'react-router-dom'

import { ButtonIconAdd } from '@webapp/components'
import { useAuthCanManageUserGroups } from '@webapp/store/user'
import { appModuleUri, userModules } from '@webapp/app/appModules'

// appModules.js is a plain JS module without explicit types: TS infers appModuleUri's parameter shape
// from its default value (appModules.home), which happens to include an `icon` field that userModules
// entries don't have (and that appModuleUri never reads). Cast to the function's own inferred parameter
// type rather than editing that shared, out-of-scope module.
type AppModule = Parameters<typeof appModuleUri>[0]

/**
 * Left side of the User Groups list table header, showing the "New Group" button to users allowed to manage groups.
 *
 * @returns {React.ReactElement} - The HeaderLeft component.
 */
const HeaderLeft = (): React.ReactElement => {
  const navigate = useNavigate()
  const canManage = useAuthCanManageUserGroups()

  return (
    <div>
      {canManage && (
        <ButtonIconAdd
          showLabel
          label="usersView:userGroup.new"
          onClick={() => navigate(appModuleUri(userModules.userGroupNew as AppModule))}
          variant="contained"
        />
      )}
    </div>
  )
}

export default HeaderLeft
