import React from 'react'
import PropTypes from 'prop-types'

import { TextInput } from '@webapp/components/form'

const HeaderLeft = (props) => {
  const { handleSearch, search, totalCount } = props

  if (!totalCount) return null

  return (
    <TextInput
      className="surveys__header-left__input-search"
      defaultValue={search}
      onChange={(val) => {
        handleSearch(val)
      }}
      placeholder="surveysView.filterPlaceholder"
    />
  )
}

HeaderLeft.propTypes = {
  handleSearch: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  totalCount: PropTypes.number.isRequired,
}

export default HeaderLeft
