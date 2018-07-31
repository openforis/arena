import React from 'react'

import FormDesignerComponent from './formDesignerComponents/formDesignerComponent'
import FormComponent from './formComponents/formComponent'

class FormRendererComponent extends React.Component {

  render () {
    const {entityDef, edit = false} = this.props

    return (
      edit
        ? <FormDesignerComponent entityDef={entityDef}/>
        : <FormComponent entityDef={entityDef}/>
    )
  }

}

FormRendererComponent.defaultProps = {
  //root entity
  entityDef: {},
}

export default FormRendererComponent