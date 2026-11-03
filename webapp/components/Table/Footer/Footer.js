import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { updateQuery } from '@webapp/components/Table/tableLink'

import Paginator from './Paginator'
import { TablesActions } from '@webapp/store/ui/tables'
import { useI18n } from '@webapp/store/system'

export const Footer = (props) => {
  const { count, limit, list, module, offset, selectedItemsCount = 0 } = props

  const i18n = useI18n()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (
    <div className="table__footer">
      {selectedItemsCount > 0 && (
        <span className="table__footer-selected-items">
          {i18n.t('itemsTable.selectedItemsCount', { count: selectedItemsCount })}
        </span>
      )}
      {!Objects.isEmpty(list) && (
        <Paginator
          offset={offset}
          limit={limit}
          count={count}
          setLimit={(limitUpdated) => {
            updateQuery(navigate)({ limit: limitUpdated })
            dispatch(TablesActions.updateMaxRows({ module, maxRows: limitUpdated }))
          }}
          setOffset={(offsetUpdated) => updateQuery(navigate)({ offset: offsetUpdated })}
        />
      )}
    </div>
  )
}

Footer.propTypes = {
  count: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  list: PropTypes.array,
  module: PropTypes.string.isRequired,
  offset: PropTypes.number.isRequired,
  selectedItemsCount: PropTypes.number,
}
