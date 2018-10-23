import './items.scss'

import React from 'react'
import ItemsTable from './itemsTable'

const Header = props => {
  const {headerText, onAdd} = props

  return <div className="items__header">
    <h5>{headerText}</h5>

    <button className="btn btn-s btn-of-light-xs"
            onClick={onAdd}>
      <span className="icon icon-plus icon-16px icon-left"/>
      ADD
    </button>
  </div>
}

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
        <Header {...props}/>
        <ItemsTable {...props} />
        {
          onClose
            ? <div style={{justifySelf: 'center'}}>
              <button className="btn btn-of-light"
                      onClick={() => {
                        onClose ? onClose() : null
                      }}>
                Close
              </button>
            </div>
            : null
        }
      </div>
    )
}

export default ItemsView