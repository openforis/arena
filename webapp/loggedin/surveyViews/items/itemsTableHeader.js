import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'

import { useI18n } from '@webapp/store/system'

const ItemsTableHeader = ({ onAdd, readOnly }) => {
  const i18n = useI18n()
  const history = useHistory()

  return (
    !readOnly && (
      <div className="table__header">
        <button type="button" className="btn btn-s" onClick={() => onAdd(history)}>
          <span className="icon icon-plus icon-12px icon-left" />
          {i18n.t('common.add')}
        </button>
      </div>
    )
  )
}

ItemsTableHeader.propTypes = {
  onAdd: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired,
}

export default ItemsTableHeader
