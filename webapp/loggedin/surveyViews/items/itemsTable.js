import React from 'react'
import * as R from 'ramda'

import ErrorBadge from '@webapp/commonComponents/errorBadge'
import WarningBadge from '@webapp/commonComponents/warningBadge'
import {useI18n} from '@webapp/commonComponents/hooks'

const TableRow = props => {
  const {
    item, selectedItemUuid, itemLabelFunction,
    canSelect, onSelect, onEdit, canDelete, onDelete, readOnly,
  } = props

  const i18n = useI18n()

  const name = R.defaultTo(`--- ${i18n.t('common.undefinedName')} ---`, itemLabelFunction(item))

  const selected = item.uuid === selectedItemUuid

  return (
    <div className="table__row">

      <div className="name">
        {name}
        <ErrorBadge validation={item.validation}/>
        <WarningBadge show={!item.usedByNodeDefs} label={i18n.t('itemsTable.unused')}/>
      </div>

      <div className="buttons">
        {
          onSelect && (canSelect || selected) &&
          <button className={`btn btn-s${selected ? ' active' : ''}`}
            onClick={() => onSelect(item)}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`}/>
            {selected ? 'Selected' : 'Select'}
          </button>
        }

        <button className="btn btn-s"
          onClick={() => onEdit(item)}>
          <span className={`icon icon-${readOnly ? 'eye' : 'pencil2'} icon-12px icon-left`}/>
          {readOnly ? i18n.t('common.view') : i18n.t('common.edit')}
        </button>

        {
          !readOnly &&
          <button className="btn btn-s"
            onClick={() => {
              if (canDelete(item)) {
                onDelete(item)
              }
            }}>
            <span className="icon icon-bin2 icon-12px icon-left"/>
            {i18n.t('common.delete')}
          </button>
        }
      </div>
    </div>
  )
}

const Header = ({onAdd, readOnly}) => {
  const i18n = useI18n()

  return !readOnly && (
    <div className="table__header">

      <button className="btn btn-s"
        onClick={onAdd}>
        <span className="icon icon-plus icon-12px icon-left"/>
        {i18n.t('common.add')}
      </button>
    </div>
  )
}

const ItemsTable = props => {
  const {items} = props
  const i18n = useI18n()

  return (
    <div className="table">

      <Header {...props}/>

      {
        R.isEmpty(items)
          ? <div className="table__empty-rows">{i18n.t('itemsTable.noItemsAdded')}</div>
          : (
            <div className="table__content">
              <div className="table__row-header">
                <div className="name">{i18n.t('common.name')}</div>
                <div/>
              </div>
              <div className="table__rows">
                {
                  items.map(item =>
                    <TableRow {...props}
                      key={item.uuid}
                      item={item}
                    />)
                }
              </div>
            </div>
          )
      }
    </div>
  )
}

export default ItemsTable
