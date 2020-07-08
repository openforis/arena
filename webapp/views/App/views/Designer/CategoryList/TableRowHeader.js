import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

const TableRowHeader = (props) => {
  const { canSelect } = props

  const i18n = useI18n()
  const canEdit = useAuthCanEditSurvey()

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
  canSelect: PropTypes.bool.isRequired,
}

export default TableRowHeader
