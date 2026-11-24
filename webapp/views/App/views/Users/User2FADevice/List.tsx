import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import Table from '@webapp/components/Table'
import { appModuleUri, user2FADeviceModules } from '@webapp/app/appModules'

import { useUser2FADeviceColumns } from './useColumns'
import User2FADeviceHeaderLeft from './HeaderLeft'

export const User2FADeviceList = () => {
  const navigate = useNavigate()
  const onRowOpen = useCallback(
    (item) => {
      navigate(`${appModuleUri(user2FADeviceModules.user2FADevice)}${item.uuid}`)
    },
    [navigate]
  )
  const columns = useUser2FADeviceColumns({ onRowOpen })

  return (
    <Table
      module="2fa-devices"
      moduleApiUri="/api/2fa/devices"
      columns={columns}
      headerLeftComponent={User2FADeviceHeaderLeft}
      onRowOpen={onRowOpen}
      visibleColumnsSelectionEnabled
    />
  )
}
