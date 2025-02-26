import React from 'react'

import { ButtonDownload } from '@webapp/components'
import { TextInput } from '@webapp/components/form'

export const TableHeaderLeft = (props) => {
  const { search, handleSearch } = props
  return (
    <div>
      <ButtonDownload label="common.exportAll" href="/api/users/export" />
      <TextInput
        className="users__header-left__input-search"
        placeholder="usersView.filterPlaceholder"
        defaultValue={search}
        onChange={handleSearch}
      />
    </div>
  )
}
