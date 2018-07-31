import React from 'react'
import { connect } from 'react-redux'

import FormDesignerComponent from './formDesignerComponents/formDesignerComponent'
import FormComponent from './formComponents/formComponent'

import { getCurrentSurvey, getEntityDefsByParentId, getRootEntityDef } from './surveyState'
import { fetchNodeDef } from './nodeDefActions'

class FormRendererComponent extends React.Component {

  componentDidMount () {
    const {survey, fetchNodeDef, edit} = this.props
    fetchNodeDef(survey.rootNodeDefId, edit)
  }

  render () {
    const {rootEntityDef, edit = false} = this.props

    return (
      edit
        ? <FormDesignerComponent entityDef={rootEntityDef}/>
        : <FormComponent entityDef={rootEntityDef}/>
    )
  }

}

FormRendererComponent.defaultProps = {
  //root entity
  rootEntityDef: {},
}

const mapStateToProps = state => ({
  survey: getCurrentSurvey(state),
  rootEntityDef: getRootEntityDef(state),
  rootEntityDefds: getEntityDefsByParentId(state),
})

export default connect(mapStateToProps, {fetchNodeDef})(FormRendererComponent)