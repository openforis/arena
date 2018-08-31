import './form/surveyForm.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormNavigation from './form/formNavigation'
import FormActions from './form/formActions'
import NodeDefEdit from './form/nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from '../nodeDef/components/nodeDefSwitch'

import { getRootNodeDef } from '../../../common/survey/survey'
import { getRootNode } from '../../../common/record/record'
import { getSurveyState, getCurrentSurvey, getFormNodeDefViewPage } from '../surveyState'
import { getRecord } from '../record/recordState'

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
    const {
      rootNodeDef,
      nodeDef,
      edit,
      draft,
      // data entry mode props
      entry,
      rootNode
    } = this.props

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
                ? <NodeDefSwitch nodeDef={nodeDef} edit={edit} draft={draft}
                                 entry={entry} node={rootNode}/>
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
  // can entry data
  entry: false,
  // record being edited
  rootNode: null,
}

const mapStateToProps = (state, props) => ({
  survey: getCurrentSurvey(state),
  rootNodeDef: getRootNodeDef(getSurveyState(state)),
  nodeDef: getFormNodeDefViewPage(state),
  rootNode: props.entry ? getRootNode(getRecord(state)) : null,
})

export default connect(
  mapStateToProps,
  {fetchRootNodeDef, setFormNodeDefViewPage}
)(SurveyFormView)