import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import Table from '@webapp/components/Table'
import { appModuleUri, systemAdminModules } from '@webapp/app/appModules'

import MessagesHeaderLeft from './MessagesHeaderLeft'
import { useMessageListColumns } from './useMessageListColumns'

export const MessageList = () => {
  const navigate = useNavigate()
  const onRowOpen = useCallback(
    (message) => {
      navigate(`${appModuleUri(systemAdminModules.message)}${message.uuid}`)
    },
    [navigate]
  )
  const columns = useMessageListColumns({ onRowOpen })

  return (
    <Table
      module="messages"
      moduleApiUri="/api/messages"
      className="messages-list"
      columns={columns}
      headerLeftComponent={MessagesHeaderLeft}
      onRowOpen={onRowOpen}
      visibleColumnsSelectionEnabled
    />
  )
}
