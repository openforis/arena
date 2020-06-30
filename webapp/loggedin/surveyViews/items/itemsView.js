import './itemsView.scss'

import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import ItemsTable from './itemsTable'
import ItemsColumn from './itemsColumn'

const CellRendererName = (props) => {
  const { item, itemLabelFunction } = props

  const i18n = useI18n()

  const name = R.defaultTo(`--- ${i18n.t('common.undefinedName')} ---`, itemLabelFunction(item))

  return (
    <>
      {name}
      <ErrorBadge validation={item.validation} />
      <WarningBadge show={!item.usedByNodeDefs} label={i18n.t('itemsTable.unused')} />
    </>
  )
}

CellRendererName.propTypes = {
  item: PropTypes.object.isRequired,
  itemLabelFunction: PropTypes.func.isRequired,
}

const ItemsView = (props) => {
  const {
    columns,
    items,
    itemLink,
    itemLabelFunction,
    selectedItemUuid,
    canSelect,
    canDelete,
    readOnly,
    className,
    onAdd,
    onSelect,
    onEdit,
    onDelete,
    onClose,
  } = props

  const i18n = useI18n()

  return (
    <div className={`items${className ? ` ${className}` : ''}`}>
      <ItemsTable
        columns={columns}
        items={items}
        itemLink={itemLink}
        itemLabelFunction={itemLabelFunction}
        selectedItemUuid={selectedItemUuid}
        canSelect={canSelect}
        canDelete={canDelete}
        readOnly={readOnly}
        onAdd={onAdd}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {onClose && (
        <div className="items__footer">
          <button type="button" className="btn" onClick={onClose}>
            {i18n.t('common.close')}
          </button>
        </div>
      )}
    </div>
  )
}

ItemsView.propTypes = {
  columns: PropTypes.arrayOf(Object),
  items: PropTypes.array,
  itemLink: PropTypes.string,
  itemLabelFunction: PropTypes.func,
  selectedItemUuid: PropTypes.string,
  canSelect: PropTypes.bool,
  canDelete: PropTypes.func,
  readOnly: PropTypes.bool,
  className: PropTypes.string,
  onAdd: PropTypes.func,
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onClose: PropTypes.func,
}

ItemsView.defaultProps = {
  columns: [new ItemsColumn('common.name', CellRendererName, 'name')],
  items: [],
  itemLink: null,
  itemLabelFunction: null,
  selectedItemUuid: null,
  canSelect: false,
  canDelete: null,
  readOnly: true,
  className: null,
  onAdd: null,
  onSelect: null,
  onEdit: null,
  onDelete: null,
  onClose: null,
}

export default ItemsView
