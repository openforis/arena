import './react-grid-layout.scss'

import React from 'react'

import PageHeadersComponent from './components/pageHeadersComponent'
import EntityDefComponent from './nodeDef/entityDefComponent'

const FormComponent = (props) => {

  const {nodeDef} = props

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '40px 1fr',
    }}>

      {/*//tab navigation*/}
      {/*<FormPageHeadersComponent entityDef={entityDef}/>*/}
      <div>PAGES</div>

      {/*//current page*/}
      <EntityDefComponent nodeDef={nodeDef}/>
    </div>
  )

}

export default FormComponent