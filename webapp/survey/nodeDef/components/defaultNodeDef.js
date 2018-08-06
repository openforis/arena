import React from 'react'
import { Input, FormItem } from '../../../commonComponents/form/input'

class DefaultNodeDef extends React.Component {


  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItem label={nodeDef.props.name}>
        <Input readOnly={edit}/>
      </FormItem>
    )
  }

}

export default DefaultNodeDef
