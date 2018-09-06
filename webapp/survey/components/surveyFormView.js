import './form/surveyForm.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormNavigation from './form/formNavigation'
import FormActions from './form/formActions'
import NodeDefEdit from './form/nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from '../nodeDef/components/nodeDefSwitch'

import { getRootNodeDef } from '../../../common/survey/survey'
import { getRootNode } from '../../../common/record/record'
import { getSurvey, getFormActivePageNodeDef, getFormActivePageParentNode } from '../surveyState'
import { getRecord } from '../record/recordState'

import { fetchRootNodeDef } from '../actions'
import { setFormActivePage, setFormNodeDefUnlocked } from '../nodeDef/actions'

class SurveyFormView extends React.Component {

  componentDidMount () {
    const {fetchRootNodeDef, setFormActivePage, setFormNodeDefUnlocked, edit} = this.props

    setFormActivePage(null)
    setFormNodeDefUnlocked(null)
    fetchRootNodeDef(edit)
  }

  componentDidUpdate () {
    const {rootNodeDef, nodeDef, rootNode, setFormActivePage, edit, entry} = this.props

    if (edit && rootNodeDef && !nodeDef) {
      setFormActivePage(rootNodeDef)
    }

    if (entry && rootNodeDef && rootNode && !nodeDef) {
      setFormActivePage(rootNodeDef)
    }
  }

  render () {
    const {
      rootNodeDef,
      nodeDef,
      edit,
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

            {
              nodeDef && (edit || (entry && rootNode))
                ? <React.Fragment>
                  <FormNavigation {...this.props}/>
                  <NodeDefSwitch {...this.props} />
                </React.Fragment>
                : <div/>
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

const mapStateToProps = (state, props) => {
  const survey = getSurvey(state)

  return {
    survey,
    rootNodeDef: getRootNodeDef(survey),
    nodeDef: getFormActivePageNodeDef(state),
    rootNode: props.entry ? getRootNode(getRecord(survey)) : {},
    // parentNode: getFormActivePageParentNode(state),
  }
}

export default connect(
  mapStateToProps,
  {fetchRootNodeDef, setFormActivePage, setFormNodeDefUnlocked}
)(SurveyFormView)