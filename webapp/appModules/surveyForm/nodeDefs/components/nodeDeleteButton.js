import React from 'react'

export default ({ nodeDef, node, disabled = false, showConfirm = true, removeNode }) =>
  <button className="btn btn-s btn-of-light-xs btn-delete"
          style={{
            alignSelf: 'center',
            justifySelf: 'center'
          }}
          aria-disabled={disabled}
          onClick={() => {
            if (!showConfirm || confirm('Are you sure you want to delete this item?'))
              removeNode(nodeDef, node)
          }}>
    <span className="icon icon-bin icon-12px"/>
  </button>
