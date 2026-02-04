import React, { useCallback } from 'react'
import { useNavigate } from 'react-router'

import Table from '@webapp/components/Table'
import { appModuleUri, userModules } from '@webapp/app/appModules'

import { useUserTwoFactorDeviceColumns } from './useColumns'
import UserTwoFactorDeviceHeaderLeft from './HeaderLeft'

export const UserTwoFactorDeviceList = () => {
  const navigate = useNavigate()
  const columns = useUserTwoFactorDeviceColumns()
  const onRowClick = useCallback(
    (item) => {
      navigate(`${appModuleUri(userModules.userTwoFactorDevice)}${item.uuid}`)
    },
    [navigate]
  )

  return (
    <Table
      module="2fa-devices"
      moduleApiUri="/api/2fa/devices"
      columns={columns}
      headerLeftComponent={UserTwoFactorDeviceHeaderLeft}
      onRowClick={onRowClick}
      selectable={false}
      visibleColumnsSelectionEnabled
    />
  )
}
