import React from 'react'
import { connect } from 'react-redux'

import FormDesignerComponent from './formDesigner/formDesignerComponent'
import FormComponent from './form/formComponent'

import { getCurrentSurvey, getRootNodeDef } from './surveyState'
import { fetchRootNodeDef } from './actions'

class SurveyFormView extends React.Component {

  componentDidMount () {
    const {fetchRootNodeDef, edit} = this.props
    fetchRootNodeDef(edit)
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
  rootEntityDef: {
    props: {
      layout: {

      },
    }
  },
}

const mapStateToProps = state => ({
  survey: getCurrentSurvey(state),
  rootEntityDef: getRootNodeDef(state),
})

export default connect(mapStateToProps, {fetchRootNodeDef})(SurveyFormView)