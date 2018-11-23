import React from 'react'
import * as R from 'ramda'

import {
  isValid
} from '../../../../../common/validation/validator'

import ReadOnlyWrapper from '../../../../commonComponents/form/readOnlyWrapper'

const TableRow = props => {

  const {
    item, selectedItemUUID, itemLabelFunction,
    canSelect, onSelect, onEdit, canDelete, onDelete, readOnly,
  } = props

  const name = R.defaultTo('--- undefined name ---', itemLabelFunction(item))

  const selected = item.uuid === selectedItemUUID

  return (
    <div className="items__table-row">
      <div>
        {name}
        {
          isValid(item)
            ? null
            : (
              <span className="error-badge" style={{marginLeft: '2rem'}}>
                <span className="icon icon-warning icon-12px icon-left"/>
                <span>INVALID</span>
              </span>
            )
        }
      </div>

      {
        onSelect &&
        (canSelect || selected)
          ? <button className={`btn btn-s btn-of-light-xs${selected ? ' active' : ''}`}
                    onClick={() => onSelect(item)}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`}/>
            {selected ? 'Selected' : 'Select'}
          </button>
          : <div/>
      }

      <button className="btn btn-s btn-of-light-xs"
              onClick={() => onEdit(item)}>
        <span className="icon icon-pencil2 icon-12px icon-left"/>
        Edit
      </button>

      <ReadOnlyWrapper readOnly={readOnly}>
        <button className="btn btn-s btn-of-light-xs"
                onClick={() => {
                  if (canDelete(item)) {
                    onDelete(item)
                  }
                }}>
          <span className="icon icon-bin2 icon-12px icon-left"/>
          Delete
        </button>
      </ReadOnlyWrapper>
    </div>
  )
}

const ItemsTable = (props) => {
  const {items} = props
  return (
    R.isEmpty(items)
      ? <div>No items added</div>
      : <div className="items__table">
        {
          items.map(item =>
            <TableRow {...props}
                      key={item.uuid}
                      item={item}
            />)
        }
      </div>
  )
}

export default ItemsTable