import React from 'react'
import { FormInput } from '../../../commonComponents/formInputComponents'

class DefaultNodeDefComponent extends React.Component {

  componentDidMount () {
    const {nodeDef, draft, edit, render} = this.props

    if (!nodeDef.id)
      this.refs.elem.scrollIntoView()
  }

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
