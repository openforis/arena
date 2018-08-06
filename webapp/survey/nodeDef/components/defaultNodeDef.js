import React from 'react'
import { Input, FormItem } from '../../../commonComponents/form/input'

class DefaultNodeDef extends React.Component {


  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItem label={`nodeName: ${nodeDef.props.name}`}>
        <Input readOnly={edit}/>
      </FormItem>
    )
  }

}

export default DefaultNodeDef
