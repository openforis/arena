import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const TableRowHeader = (props) => {
  const { canEdit, canSelect } = props

  const i18n = useI18n()

  return (
    <>
      <div>{i18n.t('#')}</div>
      <div>{i18n.t('common.name')}</div>
      {canEdit && (
        <>
          <div /> {/* Error badge */}
          <div /> {/* Warning badge */}
        </>
      )}
      {canSelect && (
        <>
          <div /> {/* Select button */}
        </>
      )}
      {canEdit && (
        <>
          <div /> {/* Edit button */}
          <div /> {/* Delete button */}
        </>
      )}
    </>
  )
}

TableRowHeader.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  canSelect: PropTypes.bool.isRequired,
}

export default TableRowHeader
