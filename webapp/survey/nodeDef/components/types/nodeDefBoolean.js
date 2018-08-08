import React from 'react'

import NodeDefFormItem from './nodeDefFormItem'

class NodeDefBoolean extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <NodeDefFormItem nodeDef={nodeDef}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '.1fr .2fr .1fr .2fr',
          alignItems: 'center',
          height: '3rem',
        }}>
          <button className="btn btn-s btn-transparent">
            <span className="icon icon-radio-checked2 icon-left"/>
            YES
          </button>
          <button className="btn btn-s btn-transparent">
            <span className="icon icon-radio-unchecked icon-left"/>
            NO
          </button>
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefBoolean
