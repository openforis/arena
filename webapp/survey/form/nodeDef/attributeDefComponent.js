import React from 'react'

class AttributeDefComponent extends React.Component {

  componentDidMount () {
    const {nodeDef} = this.props

    if (!nodeDef.id)
      this.refs.elem.scrollIntoView()
  }

  render () {
    const {nodeDef} = this.props
    return (
      <div ref="elem">uuid: {JSON.stringify(nodeDef.uuid)}</div>
    )
  }

}

export default AttributeDefComponent
