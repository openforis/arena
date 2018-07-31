import './react-grid-layout.scss'

import React from 'react'

import FormPageHeadersComponent from './formPageHeadersComponent'
import FormPageComponent from './formPageComponent'

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
      <FormPageComponent entityDef={entityDef}/>
    </div>
  )

}

export default FormComponent