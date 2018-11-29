import React from 'react'
import * as R from 'ramda'

import ErrorBadge from '../../../../commonComponents/errorBadge'

const TableRow = props => {

  const {
    item, selectedItemUUID, itemLabelFunction,
    canSelect, onSelect, onEdit, canDelete, onDelete, readOnly,
  } = props

  const name = R.defaultTo('--- undefined name ---', itemLabelFunction(item))

  const selected = item.uuid === selectedItemUUID

  return (
    <div className="table__row">

      <div className="name">
        {name}
        <ErrorBadge validation={item.validation}/>
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
          {readOnly ? 'View' : 'Edit'}
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
            Delete
          </button>
        }
      </div>
    </div>
  )
}

const Header = ({onAdd, readOnly}) => (
  !readOnly &&
  <div className="table__header">

    <button className="btn btn-s btn-of-light"
            onClick={onAdd}>
      <span className="icon icon-plus icon-12px icon-left"/>
      ADD
    </button>
  </div>
)

const ItemsTable = (props) => {
  const {items} = props

  return (
    <React.Fragment>

      <Header {...props}/>

      {
        R.isEmpty(items)
          ? <div className="table__empty-rows">No items added</div>
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