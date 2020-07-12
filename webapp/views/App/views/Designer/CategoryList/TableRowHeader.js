import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { State as ListState } from './store'

const TableRowHeader = (props) => {
  const { listState } = props

  const canSelect = ListState.getCanSelect(listState)

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
  listState: PropTypes.object.isRequired,
}

export default TableRowHeader
