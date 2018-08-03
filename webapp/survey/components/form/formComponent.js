import './formComponent.scss'

import React from 'react'

import FormNodeDefEditComponent from './formNodeDefEditComponent'
import EntityDefComponent from './nodeDef/entityDefComponent'

const FormComponent = (props) => {
  const {nodeDef, edit, draft} = props

  return (
    <React.Fragment>
      <FormNodeDefEditComponent/>

      <div className="survey-form">

        {/*//tab navigation*/}
        {/*<FormHeadersComponent entityDef={entityDef}/>*/}
        <div>PAGES</div>

        {/*//current page*/}
        <EntityDefComponent nodeDef={nodeDef} edit={edit} draft={draft}/>
      </div>
    </React.Fragment>
  )

}

export default FormComponent