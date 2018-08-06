import './form/surveyForm.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormNavigation from './form/formNavigation'
import FormActions from './form/formActions'
import NodeDefEdit from './form/nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from '../nodeDef/components/nodeDefSwitch'

import { getCurrentSurvey, getRootNodeDef, getSurveyState } from '../surveyState'
import { fetchRootNodeDef } from '../actions'

class SurveyFormView extends React.Component {

  componentDidMount () {
    const {fetchRootNodeDef, edit} = this.props
    fetchRootNodeDef(edit)
  }

  render () {
    const {nodeDef, edit, draft} = this.props

    return (
      nodeDef ?
        <React.Fragment>

          <NodeDefEdit/>

          <div className={`survey-form${edit ? ' edit' : ''}`}>

            <FormNavigation nodeDef={nodeDef} edit={edit} draft={draft}/>

            <NodeDefSwitch nodeDef={nodeDef} edit={edit} draft={draft}/>

            {
              edit
                ? <FormActions nodeDef={nodeDef}/>
                : null
            }
          </div>
        </React.Fragment>
        : null
    )
  }

}

SurveyFormView.defaultProps = {
  //root entity
  nodeDef: null,
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