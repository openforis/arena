import './itemsView.scss'

import React from 'react'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import ItemsTable from './itemsTable'
import ItemsColumn from './itemsColumn'

const CellRendererName = props => {
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

const ItemsView = props => {
  const { className, onClose } = props
  const i18n = useI18n()

  return (
    <div className={`items${className ? ` ${className}` : ''}`}>
      <ItemsTable {...props} />

      {onClose && (
        <div className="items__footer">
          <button className="btn" onClick={() => onClose()}>
            {i18n.t('common.close')}
          </button>
        </div>
      )}
    </div>
  )
}

ItemsView.defaultProps = {
  columns: [new ItemsColumn('common.name', CellRendererName, 'name')],
  items: [],
  itemLink: null,
  selectedItemUuid: null,
  canSelect: false,
  canDelete: false,
  readOnly: true,
  className: null,
  onSelect: null,
  onDelete: null,
}

export default ItemsView
