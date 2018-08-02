import React from 'react'

import FormDesignerActionsComponent from './formDesignerActionsComponent'
import FormComponent from '../form/formComponent'

const FormDesignerComponent = ({nodeDef}) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '.8fr .2fr',
  }}>
    <FormComponent nodeDef={nodeDef}/>
    <FormDesignerActionsComponent nodeDef={nodeDef}/>
  </div>
)

export default FormDesignerComponent