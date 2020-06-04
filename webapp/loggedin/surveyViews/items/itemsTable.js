import React from 'react'
import * as R from 'ramda'
import { Link, useHistory } from 'react-router-dom'

import * as ObjectUtils from '@core/objectUtils'

import { useI18n } from '@webapp/components/hooks'

const TableRow = props => {
  const { columns, item, itemLink, selectedItemUuid, canSelect, onSelect, canDelete, onDelete, readOnly } = props

  const i18n = useI18n()

  const selected = item.uuid === selectedItemUuid

  return (
    <div className="table__row">
      {columns.map((column, idx) => (
        <div key={idx} className={column.className}>
          {React.createElement(column.cellRenderer, props)}
        </div>
      ))}

      <div className="buttons">
        {onSelect && (canSelect || selected) && (
          <button className={`btn btn-s${selected ? ' active' : ''}`} onClick={() => onSelect(item)}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />
            {selected ? i18n.t(`common.selected`) : i18n.t(`common.select`)}
          </button>
        )}

        <Link className="btn btn-s" to={`${itemLink}${ObjectUtils.getUuid(item)}/`}>
          <span className={`icon icon-${readOnly ? 'eye' : 'pencil2'} icon-12px icon-left`} />
          {readOnly ? i18n.t('common.view') : i18n.t('common.edit')}
        </Link>

        {!readOnly && (
          <button
            className="btn btn-s"
            onClick={() => {
              if (canDelete(item)) {
                onDelete(item)
              }
            }}
          >
            <span className="icon icon-bin2 icon-12px icon-left" />
            {i18n.t('common.delete')}
          </button>
        )}
      </div>
    </div>
  )
}

const Header = ({ onAdd, readOnly }) => {
  const i18n = useI18n()
  const history = useHistory()

  return (
    !readOnly && (
      <div className="table__header">
        <button className="btn btn-s" onClick={() => onAdd(history)}>
          <span className="icon icon-plus icon-12px icon-left" />
          {i18n.t('common.add')}
        </button>
      </div>
    )
  )
}

const ItemsTable = props => {
  const { items, columns } = props
  const i18n = useI18n()

  return (
    <div className="table">
      <Header {...props} />

      {R.isEmpty(items) ? (
        <div className="table__empty-rows">{i18n.t('itemsTable.noItemsAdded')}</div>
      ) : (
        <div className="table__content">
          <div className="table__row-header">
            {columns.map((column, idx) => (
              <div key={idx} className={column.className}>
                {i18n.t(column.heading)}
              </div>
            ))}
            <div />
          </div>

          <div className="table__rows">
            {items.map(item => (
              <TableRow {...props} key={item.uuid} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ItemsTable
