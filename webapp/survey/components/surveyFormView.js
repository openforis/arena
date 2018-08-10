import './form/surveyForm.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormNavigation from './form/formNavigation'
import FormActions from './form/formActions'
import NodeDefEdit from './form/nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from '../nodeDef/components/nodeDefSwitch'

import { getCurrentSurvey, getFormNodeDefViewPage, getRootNodeDef, getSurveyState } from '../surveyState'
import { fetchRootNodeDef } from '../actions'
import { setFormNodeDefViewPage } from '../nodeDef/actions'

class SurveyFormView extends React.Component {

  componentDidMount () {
    const {fetchRootNodeDef, edit} = this.props
    fetchRootNodeDef(edit)
  }

  componentDidUpdate () {
    const {rootNodeDef, nodeDef, setFormNodeDefViewPage} = this.props
    if (rootNodeDef && !nodeDef) {
      setFormNodeDefViewPage(rootNodeDef)
    }
  }

  render () {
    const {rootNodeDef, nodeDef, edit, draft} = this.props

    return (
      rootNodeDef ?
        <React.Fragment>

          {
            edit
              ? <NodeDefEdit/>
              : null
          }

          <div className={`survey-form${edit ? ' edit' : ''}`}>

            <FormNavigation rootNodeDef={rootNodeDef} edit={edit} draft={draft}/>

            {
              nodeDef
                ? <NodeDefSwitch nodeDef={nodeDef} edit={edit} draft={draft}/>
                : <div></div>
            }

            {
              edit
                ? <FormActions/>
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
  rootNodeDef: null,
  // current nodeDef page
  nodeDef: null,
  // can edit form
  edit: false,
  // load draft props
  draft: false,
}

const mapStateToProps = state => ({
  survey: getCurrentSurvey(state),
  rootNodeDef: getRootNodeDef(getSurveyState(state)),
  nodeDef: getFormNodeDefViewPage(state),
})

export default connect(
  mapStateToProps,
  {fetchRootNodeDef, setFormNodeDefViewPage}
)(SurveyFormView)