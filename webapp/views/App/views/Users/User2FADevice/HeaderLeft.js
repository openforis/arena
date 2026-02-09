import React, { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { ButtonNew } from '@webapp/components'
import { appModuleUri, user2FADeviceModules } from '@webapp/app/appModules'

const User2FADeviceHeaderLeft = () => {
  const navigate = useNavigate()

  const navigateToUser2FADeviceEditForm = useCallback(() => {
    navigate(appModuleUri(user2FADeviceModules.user2FADevice))
  }, [navigate])

  return <ButtonNew onClick={navigateToUser2FADeviceEditForm} />
}

export default User2FADeviceHeaderLeft
