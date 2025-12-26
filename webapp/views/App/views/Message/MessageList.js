import React from 'react'

import Table from '@webapp/components/Table'

import MessagesHeaderLeft from './MessagesHeaderLeft'
import { useMessageListColumns } from './useMessageListColumns'

export const MessageList = () => {
  const columns = useMessageListColumns()

  return (
    <Table
      module="messages"
      moduleApiUri="/api/messages"
      className="messages-list"
      columns={columns}
      headerLeftComponent={MessagesHeaderLeft}
      selectable={false}
      visibleColumnsSelectionEnabled
    />
  )
}
