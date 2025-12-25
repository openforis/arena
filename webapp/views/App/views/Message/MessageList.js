import './UsersList.scss'

import React from 'react'

import Table from '@webapp/components/Table'

import { TableHeaderLeft } from './TableHeaderLeft'
import { useMessageListColumns } from './useMessageListColumns'

export const MessageList = () => {
  const columns = useMessageListColumns()

  return (
    <Table
      module="messages"
      moduleApiUri="/api/messages"
      className="messages-list"
      columns={columns}
      expandableRows
      headerLeftComponent={TableHeaderLeft}
      selectable={false}
      visibleColumnsSelectionEnabled
    />
  )
}
