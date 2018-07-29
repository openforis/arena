import './react-grid-layout.scss'

import React from 'react'

import FormPageHeadersComponent from './formPageHeadersComponent'
import FormPageComponent from './formPageComponent'

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
        <FormPageComponent entityDef={entityDef}/>
      </div>
    )
  }

}

FormRendererComponent.defaultProps = {
  //root entity
  entityDef: {},
}

export default FormRendererComponent