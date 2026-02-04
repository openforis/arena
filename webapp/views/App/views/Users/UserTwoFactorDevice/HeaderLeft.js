import React, { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { ButtonNew } from '@webapp/components'
import { appModules, userModules } from '@webapp/app/appModules'

const UserTwoFactorDeviceHeaderLeft = () => {
  const navigate = useNavigate()

  const navigateToUserTwoFactorDeviceEditForm = useCallback(() => {
    navigate(
      `${appModules.users.path}/${userModules.userTwoFactorDevices.path}/${userModules.userTwoFactorDevice.path}`
    )
  }, [navigate])

  return <ButtonNew onClick={navigateToUserTwoFactorDeviceEditForm} />
}

export default UserTwoFactorDeviceHeaderLeft
