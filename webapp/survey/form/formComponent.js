import './react-grid-layout.scss'

import React from 'react'

import PageHeadersComponent from './pageHeadersComponent'
import EntityDefComponent from './nodeDef/entityDefComponent'

const FormComponent = (props) => {

  const {entityDef} = props

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '40px 1fr',
    }}>

      {/*//tab navigation*/}
      {/*<FormPageHeadersComponent entityDef={entityDef}/>*/}
      <div>PAGES</div>

      {/*//current page*/}
      <EntityDefComponent entityDef={entityDef}/>
    </div>
  )

}

export default FormComponent