import React from 'react'
import { FormInput, FormItemComponent } from '../../../commonComponents/formInputComponents'

class DefaultNodeDefComponent extends React.Component {


  render () {
    const {nodeDef} = this.props

    return (
      <FormItemComponent label={`nodeName: ${nodeDef.props.name}`}>
        <FormInput/>
      </FormItemComponent>
    )
  }

}

export default DefaultNodeDefComponent
