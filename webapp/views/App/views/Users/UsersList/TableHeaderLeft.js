import React from 'react'
import PropTypes from 'prop-types'

import { ButtonDownload } from '@webapp/components'
import { TextInput } from '@webapp/components/form'

export const TableHeaderLeft = (props) => {
  const { search, handleSearch } = props
  return (
    <div className="users__header-left">
      <TextInput
        className="users__header-left__input-search"
        placeholder="usersView.filterPlaceholder"
        defaultValue={search}
        onChange={handleSearch}
      />
      <ButtonDownload label="common.exportAll" href="/api/users/export" />
      <div /> {/* spacer */}
    </div>
  )
}

TableHeaderLeft.propTypes = {
  search: PropTypes.string,
  handleSearch: PropTypes.func.isRequired,
}
