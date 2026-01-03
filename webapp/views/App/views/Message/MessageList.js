import React, { useCallback } from 'react'
import { useNavigate } from 'react-router'

import Table from '@webapp/components/Table'
import { appModuleUri, messageModules } from '@webapp/app/appModules'

import MessagesHeaderLeft from './MessagesHeaderLeft'
import { useMessageListColumns } from './useMessageListColumns'

export const MessageList = () => {
  const navigate = useNavigate()
  const columns = useMessageListColumns()

  const onRowClick = useCallback(
    (message) => {
      navigate(`${appModuleUri(messageModules.message)}${message.uuid}`)
    },
    [navigate]
  )

  return (
    <Table
      module="messages"
      moduleApiUri="/api/messages"
      className="messages-list"
      columns={columns}
      headerLeftComponent={MessagesHeaderLeft}
      onRowClick={onRowClick}
      selectable={false}
      visibleColumnsSelectionEnabled
    />
  )
}
