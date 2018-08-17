import React from 'react'
import * as R from 'ramda'

import NodeDefFormItem from './nodeDefFormItem'

const Button = ({label, disabled, selected, value, onChange}) => (
  <button className="btn btn-s btn-transparent"
          disabled={disabled}
          onClick={() => onChange({value: value})}>
    <span className={`icon icon-radio-${selected ? 'checked2' : 'unchecked'} icon-left`}/>
    {label}
  </button>
)

class NodeDefBoolean extends React.Component {

  render () {
    const {nodeDef, draft, edit, entry, parentNode, node, onChange} = this.props

    const value = entry && node ? R.path(['value', 'value'])(node) : false

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
                  selected={value}
                  value={true}
                  onChange={onChange}/>

          <Button disabled={edit}
                  label="NO"
                  selected={!value}
                  value={false}
                  onChange={onChange}/>
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefBoolean
