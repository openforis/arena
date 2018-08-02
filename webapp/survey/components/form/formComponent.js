import React from 'react'
import EntityDefComponent from './nodeDef/entityDefComponent'

const FormComponent = (props) => {

  const {nodeDef, edit, draft} = props

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '40px 1fr',
    }}>

      {/*//tab navigation*/}
      {/*<FormHeadersComponent entityDef={entityDef}/>*/}
      <div>PAGES</div>

      {/*//current page*/}
      <EntityDefComponent nodeDef={nodeDef} edit={edit} draft={draft}/>
    </div>
  )

}

export default FormComponent