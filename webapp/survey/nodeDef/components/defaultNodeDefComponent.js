import React from 'react'
import { FormInput } from '../../../commonComponents/formInputComponents'

class DefaultNodeDefComponent extends React.Component {


  render () {
    const {nodeDef} = this.props

    return (
      <div className="form-item">
        <label className="form-label">nodeName: {nodeDef.props.name}</label>
        <FormInput/>
      </div>
    )
  }

}

export default DefaultNodeDefComponent
