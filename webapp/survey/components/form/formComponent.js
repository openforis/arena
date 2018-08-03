import './surveyForm.scss'

import React from 'react'

import NodeDefEditComponent from './nodeDefEdit/nodeDefEditComponent'
import NodeDefSwitchComponent from '../../nodeDef/components/nodeDefSwitchComponent'

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
        <NodeDefSwitchComponent nodeDef={nodeDef} edit={edit} draft={draft} render={}/>
      </div>
    </React.Fragment>
  )

}

export default FormComponent