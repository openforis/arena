import React from 'react'
import { FormItem } from '../../../commonComponents/form/input'

class NodeDefBoolean extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItem label={nodeDef.props.name}>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '.1fr .2fr .1fr .2fr',
            alignItems: 'center'
          }}>
          <span className={'icon icon-radio-checked2'} />
          <label>YES</label>
          <span className={'icon icon-radio-unchecked'} />
          <label>NO</label>
        </div>
      </FormItem>
    )
  }
}

export default NodeDefBoolean
