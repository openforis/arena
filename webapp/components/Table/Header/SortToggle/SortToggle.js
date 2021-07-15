import './SortToggle.scss'

import React from 'react'
import PropTypes from 'prop-types'

const SortToggle = ({ sort, field, handleSortBy }) => {
  return (
    <button
      type="button"
      className={`
    btn-xs btn-transparent btn-toggle
    ${sort.order || ''}
        ${sort.by === field ? '' : 'innactive'}

   `}
      onClick={() => handleSortBy(field)}
    >
      <span
        className={`icon icon-play3 icon-10px arrow-toggle
        `}
      />
    </button>
  )
}

SortToggle.propTypes = {
  sort: PropTypes.object.isRequired,
  field: PropTypes.string.isRequired,
  handleSortBy: PropTypes.func.isRequired,
}

export default SortToggle
