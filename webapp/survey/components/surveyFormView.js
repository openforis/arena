import React from 'react'
import { connect } from 'react-redux'

import FormComponent from './form/formComponent'
import FormActionsComponent from './form/formActionsComponent'

import { getCurrentSurvey, getRootNodeDef, getSurveyState } from '../surveyState'
import { fetchRootNodeDef } from '../actions'

class SurveyFormView extends React.Component {

  componentDidMount () {
    const {fetchRootNodeDef, edit} = this.props
    fetchRootNodeDef(edit)
  }

  render () {
    const {nodeDef, edit = false, draft = false} = this.props

    return (
      edit
        ? <div style={{
          display: 'grid',
          gridTemplateColumns: '.8fr .2fr',
        }}>
          <FormComponent nodeDef={nodeDef} draft={draft} edit={true}/>
          <FormActionsComponent nodeDef={nodeDef}/>
        </div>
        : <FormComponent nodeDef={nodeDef} draft={draft} edit={false}/>
    )
  }

}

SurveyFormView.defaultProps = {
  //root entity
  nodeDef: {
    props: {
      layout: {},
    }
  },
}

const mapStateToProps = state => ({
  survey: getCurrentSurvey(state),
  nodeDef: getRootNodeDef(getSurveyState(state)),
})

export default connect(mapStateToProps, {fetchRootNodeDef})(SurveyFormView)