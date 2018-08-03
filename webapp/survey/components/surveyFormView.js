import './form/surveyForm.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormActionsComponent from './form/formActionsComponent'

import { getCurrentSurvey, getRootNodeDef, getSurveyState } from '../surveyState'
import { fetchRootNodeDef } from '../actions'

import NodeDefEditComponent from './form/nodeDefEdit/nodeDefEditComponent'
import NodeDefSwitchComponent from '../nodeDef/components/nodeDefSwitchComponent'

class SurveyFormView extends React.Component {

  componentDidMount () {
    const {fetchRootNodeDef, edit} = this.props
    fetchRootNodeDef(edit)
  }

  render () {
    const {nodeDef, edit, draft} = this.props

    return (
      <React.Fragment>
        <NodeDefEditComponent/>

        <div className={`survey-form${edit ? ' edit' : ''}`}>

          <div className="survey-form__nav">PAGES</div>

          <NodeDefSwitchComponent nodeDef={nodeDef} edit={edit} draft={draft}/>

          {
            edit
              ? <FormActionsComponent nodeDef={nodeDef}/>
              : null
          }
        </div>
      </React.Fragment>
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
  // can edit form
  edit: false,
  // load draft props
  draft: false,
}

const mapStateToProps = state => ({
  survey: getCurrentSurvey(state),
  nodeDef: getRootNodeDef(getSurveyState(state)),
})

export default connect(mapStateToProps, {fetchRootNodeDef})(SurveyFormView)