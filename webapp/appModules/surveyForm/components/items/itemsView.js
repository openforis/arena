import './items.scss'

import React from 'react'
import ItemsTable from './itemsTable'

const ItemsView = (props) => {
  const {editedItem, itemEditComponent, itemEditProp, onClose} = props

  const ItemEdit = itemEditComponent

  const itemEditProps = {
    ...props,
    [itemEditProp]: editedItem
  }

  return editedItem
    ? (
      <ItemEdit {...itemEditProps}/>
    )
    : (
      <div className="items">

        <ItemsTable {...props}/>

        {
          onClose &&
          <div className="items__footer">
            <button className="btn btn-of-light"
                    onClick={() => {
                      onClose ? onClose() : null
                    }}>
              Close
            </button>
          </div>
        }

      </div>
    )
}

export default ItemsView