import { useNavigate } from 'react-router'

import { Objects } from '@openforis/arena-core'

import { updateQuery } from '@webapp/components/Table/tableLink'
import { useAppDispatch } from '@webapp/store/hooks'
import { useI18n } from '@webapp/store/system'
import { TablesActions } from '@webapp/store/ui/tables'

import Paginator from './Paginator'

type FooterProps = {
  count: number
  limit: number
  list?: any[]
  module: string
  offset: number
  selectedItemsCount?: number
}

export const Footer = (props: FooterProps) => {
  const { count, limit, list, module, offset, selectedItemsCount = 0 } = props

  const i18n = useI18n()
  const dispatch = useAppDispatch()
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
