import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'

import * as ObjectUtils from '@core/objectUtils'

import { useI18n } from '@webapp/store/system'

const ItemsTableRow = (props) => {
  const {
    columns,
    item,
    itemLink,
    selectedItemUuid,
    canSelect,
    onSelect,
    onEdit,
    canDelete,
    onDelete,
    readOnly,
  } = props

  const i18n = useI18n()
  const history = useHistory()

  const itemUuid = ObjectUtils.getUuid(item)
  const selected = itemUuid === selectedItemUuid

  return (
    <div className="table__row">
      {columns.map((column, idx) => (
        <div key={String(idx)} className={column.className}>
          {React.createElement(column.cellRenderer, props)}
        </div>
      ))}

      <div className="buttons">
        {onSelect && (canSelect || selected) && (
          <button type="button" className={`btn btn-s${selected ? ' active' : ''}`} onClick={() => onSelect(item)}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />
            {selected ? i18n.t(`common.selected`) : i18n.t(`common.select`)}
          </button>
        )}

        <button
          type="button"
          className="btn btn-s"
          onClick={() => (itemLink ? history.push(`${itemLink}${itemUuid}/`) : onEdit(item))}
        >
          <span className={`icon icon-${readOnly ? 'eye' : 'pencil2'} icon-12px icon-left`} />
          {readOnly ? i18n.t('common.view') : i18n.t('common.edit')}
        </button>

        {!readOnly && (
          <button
            type="button"
            className="btn btn-s"
            onClick={() => {
              if (canDelete && canDelete(item)) {
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

ItemsTableRow.propTypes = {
  columns: PropTypes.arrayOf(Object).isRequired,
  item: PropTypes.object.isRequired,
  itemLink: PropTypes.string,
  selectedItemUuid: PropTypes.string,
  canSelect: PropTypes.bool,
  canDelete: PropTypes.func,
  readOnly: PropTypes.bool,
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

ItemsTableRow.defaultProps = {
  itemLink: null,
  selectedItemUuid: null,
  canSelect: false,
  canDelete: null,
  readOnly: true,
  onSelect: null,
  onEdit: null,
  onDelete: null,
}

export default ItemsTableRow
