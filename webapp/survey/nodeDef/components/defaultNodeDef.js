import React from 'react'
import { FormInput, FormItem } from '../../../commonComponents/form/formInput'

class DefaultNodeDef extends React.Component {


  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItem label={`nodeName: ${nodeDef.props.name}`}>
        <FormInput readOnly={edit}/>
      </FormItem>
    )
  }

}

export default DefaultNodeDef
