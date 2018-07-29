import './react-grid-layout.scss'

import React from 'react'

import FormPageHeadersComponent from './formPageHeadersComponent'
import EntityDefPageComponent from './entityDefPageComponent'

class FormRendererComponent extends React.Component {

  render () {
    const {entityDef} = this.props


    return (
      <div style={{
        display: 'grid',
        gridTemplateRows:'40px 1fr',
      }}>

        {/*//tab navigation*/}
        <FormPageHeadersComponent entityDef={entityDef}/>

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