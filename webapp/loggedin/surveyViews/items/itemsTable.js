import React from 'react'
import * as R from 'ramda'

import ErrorBadge from '../../../commonComponents/errorBadge'
import WarningBadge from '../../../commonComponents/warningBadge'
import useI18n from '../../../commonComponents/useI18n'

const TableRow = props => {

  const {
    item, selectedItemUuid, itemLabelFunction,
    canSelect, onSelect, onEdit, canDelete, onDelete, readOnly,
  } = props

  const i18n = useI18n()

  const name = R.defaultTo(`--- ${i18n.t('itemsTable.undefinedName')} ---`, itemLabelFunction(item))

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
          <button className={`btn btn-s btn-of-light-xs${selected ? ' active' : ''}`}
                  onClick={() => onSelect(item)}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`}/>
            {selected ? 'Selected' : 'Select'}
          </button>
        }

        <button className="btn btn-s btn-of-light-xs"
                onClick={() => onEdit(item)}>
          <span className={`icon icon-${readOnly ? 'eye' : 'pencil2'} icon-12px icon-left`}/>
          {readOnly ? i18n.t('common.view') : i18n.t('common.edit')}
        </button>

        {
          !readOnly &&
          <button className="btn btn-s btn-of-light-xs"
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

const Header = ({ onAdd, readOnly }) => {
  const i18n = useI18n()

  return !readOnly && (
    <div className="table__header">

      <button className="btn btn-s btn-of-light"
              onClick={onAdd}>
        <span className="icon icon-plus icon-12px icon-left"/>
        {i18n.t('common.add')}
      </button>
    </div>
  )
}

const ItemsTable = (props) => {
  const { items } = props
  const i18n = useI18n()

  return (
    <React.Fragment>

      <Header {...props}/>

      {
        R.isEmpty(items)
          ? <div className="table__empty-rows">{i18n.t('itemsTable.noItemsAdded')}</div>
          : (
            <div className="table">
              <div className="table__row-header">
                <div className="name">Name</div>
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
    </React.Fragment>
  )
}

export default ItemsTable