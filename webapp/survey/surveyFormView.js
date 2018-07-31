import React from 'react'
import { connect } from 'react-redux'

import FormDesignerComponent from './formDesigner/formDesignerComponent'
import FormComponent from './form/formComponent'

import { getCurrentSurvey, getEntityDefsByParentId, getRootEntityDef } from './surveyState'
import { fetchNodeDef } from './nodeDefActions'

class SurveyFormView extends React.Component {

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

SurveyFormView.defaultProps = {
  //root entity
  rootEntityDef: {},
}

const mapStateToProps = state => ({
  survey: getCurrentSurvey(state),
  rootEntityDef: getRootEntityDef(state),
})

export default connect(mapStateToProps, {fetchNodeDef})(SurveyFormView)