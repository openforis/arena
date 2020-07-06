import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'

import ItemsTableRow from './itemsTableRow'
import ItemsTableHeader from './itemsTableHeader'

const ItemsTable = (props) => {
  const {
    onAdd,
    readOnly,
    items,
    columns,
    itemLink,
    itemLabelFunction,
    selectedItemUuid,
    canSelect,
    onSelect,
    canDelete,
    onDelete,
    onEdit,
  } = props
  const i18n = useI18n()

  return (
    <div className="table">
      <ItemsTableHeader onAdd={onAdd} readOnly={readOnly} />

      {R.isEmpty(items) ? (
        <div className="table__empty-rows">{i18n.t('itemsTable.noItemsAdded')}</div>
      ) : (
        <div className="table__content">
          <div className="table__row-header">
            {columns.map((column, idx) => (
              <div key={String(idx)} className={column.className}>
                {i18n.t(column.heading)}
              </div>
            ))}
            <div />
          </div>

          <div className="table__rows">
            {items.map((item) => (
              <ItemsTableRow
                key={item.uuid}
                item={item}
                columns={columns}
                itemLink={itemLink}
                itemLabelFunction={itemLabelFunction}
                selectedItemUuid={selectedItemUuid}
                canSelect={canSelect}
                canDelete={canDelete}
                readOnly={readOnly}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

ItemsTable.propTypes = {
  columns: PropTypes.arrayOf(Object).isRequired,
  items: PropTypes.array.isRequired,
  itemLink: PropTypes.string,
  itemLabelFunction: PropTypes.func,
  selectedItemUuid: PropTypes.string,
  canSelect: PropTypes.bool,
  canDelete: PropTypes.func,
  readOnly: PropTypes.bool,
  onAdd: PropTypes.func,
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

ItemsTable.defaultProps = {
  itemLink: null,
  itemLabelFunction: null,
  selectedItemUuid: null,
  canSelect: false,
  canDelete: null,
  readOnly: true,
  onAdd: null,
  onSelect: null,
  onEdit: null,
  onDelete: null,
}

export default ItemsTable
