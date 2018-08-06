import React from 'react'
import { FormInput, FormItemComponent } from '../../../commonComponents/formInputComponents'

class DefaultNodeDefComponent extends React.Component {


  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItemComponent label={`nodeName: ${nodeDef.props.name}`}>
        <FormInput readOnly={edit}/>
      </FormItemComponent>
    )
  }

}

export default DefaultNodeDefComponent
