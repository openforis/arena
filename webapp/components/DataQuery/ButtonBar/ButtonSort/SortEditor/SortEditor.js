import React from 'react'
import PropTypes from 'prop-types'

import PanelRight from '@webapp/components/PanelRight'

const SortEditor = (props) => {
  const { onClose } = props

  return (
    <PanelRight onClose={onClose}>
      <div />
    </PanelRight>
  )
}

SortEditor.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default SortEditor
