import React from 'react'

class CodeListLevel extends React.Component {

  addNewItem () {
    const item = newCodeListItem(level.uuid, parentCodeListItem ? parentCodeListItem.uuid : null)
    updateCodeListItem(item)
  }

  render () {
    const {level} = this.props

    return <div>
      <h2>LEVEL {level.index + 1}</h2>

      <h3>Items</h3>

      <button className="btn btn-s btn-of-light-xs"
              style={{marginLeft: '50px'}}
              onClick={() => this.addNewItem()}>
        <span className="icon icon-plus icon-16px icon-left"></span>
        ADD
      </button>
    </div>
  }
}

export default CodeListLevel

