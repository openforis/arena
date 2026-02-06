import React, { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { ButtonNew } from '@webapp/components'
import { appModuleUri, userTwoFactorDeviceModules } from '@webapp/app/appModules'

const UserTwoFactorDeviceHeaderLeft = () => {
  const navigate = useNavigate()

  const navigateToUserTwoFactorDeviceEditForm = useCallback(() => {
    navigate(appModuleUri(userTwoFactorDeviceModules.userTwoFactorDevice))
  }, [navigate])

  return <ButtonNew onClick={navigateToUserTwoFactorDeviceEditForm} />
}

export default UserTwoFactorDeviceHeaderLeft
