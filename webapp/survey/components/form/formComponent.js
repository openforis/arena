import './surveyForm.scss'

import React from 'react'

import NodeDefEditComponent from './nodeDefEdit/nodeDefEditComponent'
import EntityDefComponent from '../nodeDef/entityDefComponent'

const FormComponent = (props) => {
  const {nodeDef, edit, draft} = props

  return (
    <React.Fragment>
      <NodeDefEditComponent/>

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