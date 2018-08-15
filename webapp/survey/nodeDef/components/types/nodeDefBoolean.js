import React from 'react'

import NodeDefFormItem from './nodeDefFormItem'

const Button = ({label, disabled, selected}) => (
  <button className="btn btn-s btn-transparent"
          disabled={disabled}>
    <span className={`icon icon-radio-${selected ? 'checked2': 'unchecked'} icon-left`}/>
    {label}
  </button>
)


class NodeDefBoolean extends React.Component {

  render () {
    const {nodeDef, draft, edit, entry, node} = this.props

    const value = entry && node ? node.value: true

    return (
      <NodeDefFormItem nodeDef={nodeDef}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '.1fr .2fr .1fr .2fr',
          alignItems: 'center',
          height: '3rem',
        }}>
          <Button disabled={edit}
                  label="YES"
                  selected={value}/>

          <Button disabled={edit}
                  label="NO"
                  selected={!value}/>
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefBoolean
