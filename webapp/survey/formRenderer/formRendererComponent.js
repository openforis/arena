import './react-grid-layout.scss'

import React from 'react'

import EntityDefPageComponent from './entityDefPageComponent'

class FormRendererComponent extends React.Component {

  //simulate with state now
  constructor () {
    super()
    this.state = {
      pageDef: null,
      entityDef: null,
    }
  }

  render () {
    const {entityDef} = this.props

    return (
      <div style={{
        display: 'grid',
        position: 'relative',
        overflowY: 'scroll',
      }}>

        {/*//tab navigation*/}

        {/*//current page*/}
        <EntityDefPageComponent entityDef={entityDef}/>
      </div>
    )
  }

}

FormRendererComponent.defaultProps = {
  //root entity
  entityDef: {},
}

export default FormRendererComponent